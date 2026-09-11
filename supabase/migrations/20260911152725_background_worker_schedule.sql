create or replace function private.invoke_worker(function_name text, body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  project_url text;
  anon_key text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'pulseboard_project_url';
  select decrypted_secret into anon_key from vault.decrypted_secrets where name = 'pulseboard_anon_key';
  if project_url is null or anon_key is null then
    raise exception 'Pulseboard worker Vault secrets are not configured';
  end if;
  perform net.http_post(
    url => project_url || '/functions/v1/' || function_name,
    headers => jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon_key),
    body => body,
    timeout_milliseconds => 120000
  );
end;
$$;

create or replace function private.process_analysis_jobs(batch_size integer default 20)
returns void language plpgsql security definer set search_path = '' as $$
declare
  jobs jsonb;
begin
  select coalesce(jsonb_agg(message || jsonb_build_object('jobId', msg_id, 'readCount', read_ct)), '[]'::jsonb)
  into jobs
  from pgmq.read(
    queue_name => 'pulseboard_analysis_jobs',
    vt => 120,
    qty => greatest(1, least(batch_size, 20))
  );
  if jsonb_array_length(jobs) > 0 then
    perform private.invoke_worker('embed-feedback', jobs);
  end if;
end;
$$;

create or replace function public.delete_analysis_job(p_msg_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  return pgmq.delete('pulseboard_analysis_jobs', p_msg_id);
end;
$$;

revoke all on function public.delete_analysis_job(bigint) from public, anon, authenticated;
grant execute on function public.delete_analysis_job(bigint) to service_role;

select cron.schedule(
  'pulseboard-process-analysis',
  '10 seconds',
  $$select private.process_analysis_jobs(20);$$
)
where not exists (select 1 from cron.job where jobname = 'pulseboard-process-analysis');

create or replace function private.accept_workspace_invitation(p_token_hash text)
returns table(workspace_id uuid, role public.workspace_role)
language plpgsql security definer set search_path = '' as $$
declare
  invite public.workspace_invitations%rowtype;
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into invite
  from public.workspace_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  for update;
  if not found or private.is_demo_workspace(invite.workspace_id) then
    raise exception 'Invitation is invalid or expired' using errcode = 'P0001';
  end if;
  insert into public.workspace_members(workspace_id, user_id, role)
  values (invite.workspace_id, actor_id, invite.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role;
  update public.workspace_invitations
  set accepted_at = now(), accepted_by = actor_id where id = invite.id;
  return query select invite.workspace_id, invite.role;
end;
$$;
