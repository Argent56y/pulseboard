-- New sb_secret_* API keys are mapped to the service_role database role by
-- the Data API and do not populate the legacy request.jwt.claim.role setting.
-- Keep privileged mutations in private SECURITY DEFINER implementations and
-- expose only SECURITY INVOKER wrappers granted exclusively to service_role.

create or replace function private.claim_email_jobs_impl(p_limit integer default 20)
returns table(
  id bigint,
  workspace_id uuid,
  feedback_id uuid,
  subscription_id uuid,
  recipient text,
  event_type text,
  payload jsonb,
  idempotency_key text,
  attempts smallint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with claimed as (
    select job.id
    from private.email_outbox job
    where job.state in ('pending', 'failed')
      and job.attempts < 5
      and job.available_at <= now()
    order by job.available_at, job.id
    for update skip locked
    limit greatest(1, least(p_limit, 20))
  )
  update private.email_outbox job
  set state = 'processing',
      locked_at = now(),
      attempts = job.attempts + 1
  from claimed
  where job.id = claimed.id
  returning job.id,
    job.workspace_id,
    job.feedback_id,
    job.subscription_id,
    job.recipient,
    job.event_type,
    job.payload,
    job.idempotency_key,
    job.attempts;
end;
$$;

revoke all on function private.claim_email_jobs_impl(integer) from public, anon, authenticated;
grant execute on function private.claim_email_jobs_impl(integer) to service_role;

create or replace function public.claim_email_jobs(p_limit integer default 20)
returns table(
  id bigint,
  workspace_id uuid,
  feedback_id uuid,
  subscription_id uuid,
  recipient text,
  event_type text,
  payload jsonb,
  idempotency_key text,
  attempts smallint
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.claim_email_jobs_impl(p_limit);
$$;

revoke all on function public.claim_email_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_email_jobs(integer) to service_role;

create or replace function private.complete_email_job_impl(p_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.email_outbox
  set state = 'sent', sent_at = now(), locked_at = null, last_error = null
  where id = p_id;
$$;

revoke all on function private.complete_email_job_impl(bigint) from public, anon, authenticated;
grant execute on function private.complete_email_job_impl(bigint) to service_role;

create or replace function public.complete_email_job(p_id bigint)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.complete_email_job_impl(p_id);
$$;

revoke all on function public.complete_email_job(bigint) from public, anon, authenticated;
grant execute on function public.complete_email_job(bigint) to service_role;

create or replace function private.fail_email_job_impl(p_id bigint, p_error text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.email_outbox
  set state = case
        when attempts >= 5 then 'failed'::public.job_state
        else 'pending'::public.job_state
      end,
      available_at = now() + make_interval(secs => least(900, (2 ^ attempts)::integer * 15)),
      locked_at = null,
      last_error = left(p_error, 500)
  where id = p_id;
$$;

revoke all on function private.fail_email_job_impl(bigint, text) from public, anon, authenticated;
grant execute on function private.fail_email_job_impl(bigint, text) to service_role;

create or replace function public.fail_email_job(p_id bigint, p_error text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.fail_email_job_impl(p_id, p_error);
$$;

revoke all on function public.fail_email_job(bigint, text) from public, anon, authenticated;
grant execute on function public.fail_email_job(bigint, text) to service_role;

create or replace function private.create_unsubscribe_token_impl(p_subscription_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  secret text;
  signature text;
begin
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'pulseboard_queue_secret';

  if secret is null then
    raise exception 'Pulseboard queue secret is not configured';
  end if;

  signature := encode(
    extensions.hmac(
      convert_to(p_subscription_id::text, 'utf8'),
      convert_to(secret, 'utf8'),
      'sha256'
    ),
    'hex'
  );

  return p_subscription_id::text || '.' || signature;
end;
$$;

revoke all on function private.create_unsubscribe_token_impl(uuid) from public, anon, authenticated;
grant execute on function private.create_unsubscribe_token_impl(uuid) to service_role;

create or replace function public.create_unsubscribe_token(p_subscription_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.create_unsubscribe_token_impl(p_subscription_id);
$$;

revoke all on function public.create_unsubscribe_token(uuid) from public, anon, authenticated;
grant execute on function public.create_unsubscribe_token(uuid) to service_role;
