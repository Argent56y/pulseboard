-- Keep queue mutation outside the exposed schema. The public endpoint is an
-- invoker wrapper executable only by the service role used by the worker.

create or replace function private.delete_analysis_job_impl(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.delete('pulseboard_analysis_jobs', p_msg_id);
$$;

revoke all on function private.delete_analysis_job_impl(bigint) from public, anon, authenticated;
grant execute on function private.delete_analysis_job_impl(bigint) to service_role;

create or replace function public.delete_analysis_job(p_msg_id bigint)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.delete_analysis_job_impl(p_msg_id);
$$;

revoke all on function public.delete_analysis_job(bigint) from public, anon, authenticated;
grant execute on function public.delete_analysis_job(bigint) to service_role;
