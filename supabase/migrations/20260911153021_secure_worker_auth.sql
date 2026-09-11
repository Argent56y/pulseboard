create or replace function public.validate_worker_secret(p_secret text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from vault.decrypted_secrets secret
    where secret.name = 'pulseboard_queue_secret'
      and extensions.digest(coalesce(p_secret, ''), 'sha256') = extensions.digest(secret.decrypted_secret, 'sha256')
  );
$$;

revoke all on function public.validate_worker_secret(text) from public, authenticated;
grant execute on function public.validate_worker_secret(text) to anon, service_role;

create or replace function private.invoke_worker(function_name text, body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  project_url text;
  anon_key text;
  queue_secret text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'pulseboard_project_url';
  select decrypted_secret into anon_key from vault.decrypted_secrets where name = 'pulseboard_anon_key';
  select decrypted_secret into queue_secret from vault.decrypted_secrets where name = 'pulseboard_queue_secret';
  if project_url is null or anon_key is null or queue_secret is null then
    raise exception 'Pulseboard worker Vault secrets are not configured';
  end if;
  perform net.http_post(
    url => project_url || '/functions/v1/' || function_name,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-pulseboard-queue', queue_secret
    ),
    body => body,
    timeout_milliseconds => 120000
  );
end;
$$;
