create or replace function public.create_unsubscribe_token(p_subscription_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  secret text;
  signature text;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'pulseboard_queue_secret';
  signature := encode(extensions.hmac(convert_to(p_subscription_id::text, 'utf8'), convert_to(secret, 'utf8'), 'sha256'), 'hex');
  return p_subscription_id::text || '.' || signature;
end;
$$;

create or replace function public.unsubscribe_feedback(p_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  subscription_id uuid;
  supplied_signature text;
  expected_signature text;
  secret text;
  changed integer;
begin
  if p_token !~* '^[0-9a-f-]{36}\.[0-9a-f]{64}$' then return false; end if;
  subscription_id := split_part(p_token, '.', 1)::uuid;
  supplied_signature := split_part(p_token, '.', 2);
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'pulseboard_queue_secret';
  expected_signature := encode(extensions.hmac(convert_to(subscription_id::text, 'utf8'), convert_to(secret, 'utf8'), 'sha256'), 'hex');
  if supplied_signature <> expected_signature then return false; end if;
  update public.feedback_subscriptions
  set is_active = false, unsubscribed_at = now()
  where id = subscription_id and is_active;
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function public.create_unsubscribe_token(uuid) from public, anon, authenticated;
grant execute on function public.create_unsubscribe_token(uuid) to service_role;
revoke all on function public.unsubscribe_feedback(text) from public, authenticated;
grant execute on function public.unsubscribe_feedback(text) to anon, service_role;

create or replace function private.process_email_jobs()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from private.email_outbox
    where state in ('pending', 'failed') and attempts < 5 and available_at <= now()
  ) then
    perform private.invoke_worker('send-product-email', '{}'::jsonb);
  end if;
end;
$$;

select cron.schedule(
  'pulseboard-process-email',
  '30 seconds',
  $$select private.process_email_jobs();$$
)
where not exists (select 1 from cron.job where jobname = 'pulseboard-process-email');
