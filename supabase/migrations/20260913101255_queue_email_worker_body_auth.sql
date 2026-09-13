-- pg_net may normalize custom HTTP headers. Add the queue credential to the
-- email worker body as a second authenticated channel, matching the analysis
-- worker pattern. The Edge Function validates it before claiming any jobs.

create or replace function private.invoke_worker(function_name text, body jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  anon_key text;
  queue_secret text;
  request_body jsonb;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'pulseboard_project_url';

  select decrypted_secret into anon_key
  from vault.decrypted_secrets
  where name = 'pulseboard_anon_key';

  select decrypted_secret into queue_secret
  from vault.decrypted_secrets
  where name = 'pulseboard_queue_secret';

  if project_url is null or anon_key is null or queue_secret is null then
    raise exception 'Pulseboard worker Vault secrets are not configured';
  end if;

  request_body := case
    when function_name = 'embed-feedback' then
      jsonb_build_object('jobs', body, 'queueSecret', queue_secret)
    else
      coalesce(body, '{}'::jsonb) || jsonb_build_object('queueSecret', queue_secret)
  end;

  perform net.http_post(
    url => project_url || '/functions/v1/' || function_name,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-pulseboard-queue', queue_secret
    ),
    body => request_body,
    timeout_milliseconds => 120000
  );
end;
$$;
