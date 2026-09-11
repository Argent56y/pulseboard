-- Pulseboard public beta: moderation, imports, subscriptions, background jobs,
-- search, rate limits, and least-privilege invitation acceptance.

create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create type public.feedback_visibility as enum ('published', 'hidden', 'merged');
create type public.import_state as enum ('pending', 'processing', 'completed', 'completed_with_errors', 'failed');
create type public.job_state as enum ('pending', 'processing', 'sent', 'failed');

alter table public.feedback_posts
  add column duplicate_of_id uuid references public.feedback_posts(id) on delete set null,
  add column visibility public.feedback_visibility not null default 'published',
  add column import_id uuid,
  add column import_row_index integer,
  add column search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored;

alter table public.feedback_comments
  add column is_hidden boolean not null default false,
  add column hidden_by uuid references auth.users(id) on delete set null,
  add column hidden_at timestamptz;

create table public.feedback_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  filename text not null check (char_length(filename) between 1 and 255),
  state public.import_state not null default 'pending',
  total_rows integer not null default 0 check (total_rows between 0 and 1000),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  unique (id, workspace_id)
);

alter table public.feedback_posts
  add constraint feedback_import_fk
    foreign key (import_id, workspace_id)
    references public.feedback_imports(id, workspace_id)
    on delete set null (import_id),
  add constraint feedback_import_row_unique unique (import_id, import_row_index),
  add constraint feedback_duplicate_not_self check (duplicate_of_id is null or duplicate_of_id <> id),
  add constraint merged_feedback_has_canonical check (
    (visibility = 'merged' and duplicate_of_id is not null)
    or (visibility <> 'merged' and duplicate_of_id is null)
  );

create table public.feedback_duplicate_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid not null,
  duplicate_id uuid not null,
  state public.link_state not null default 'suggested',
  similarity real not null check (similarity between 0 and 1),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint duplicate_feedback_fk foreign key (feedback_id, workspace_id)
    references public.feedback_posts(id, workspace_id) on delete cascade,
  constraint duplicate_candidate_fk foreign key (duplicate_id, workspace_id)
    references public.feedback_posts(id, workspace_id) on delete cascade,
  constraint duplicate_link_not_self check (feedback_id <> duplicate_id),
  unique (feedback_id, duplicate_id)
);

create table public.feedback_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  constraint subscription_feedback_fk foreign key (feedback_id, workspace_id)
    references public.feedback_posts(id, workspace_id) on delete cascade,
  unique (feedback_id, user_id)
);

create table private.rate_limit_buckets (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (workspace_id, actor_id, action, window_start)
);

create table private.email_outbox (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid references public.feedback_posts(id) on delete cascade,
  subscription_id uuid references public.feedback_subscriptions(id) on delete cascade,
  recipient text not null,
  event_type text not null check (event_type in ('staff_reply', 'status_changed', 'shipped')),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  state public.job_state not null default 'pending',
  attempts smallint not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

select pgmq.create('pulseboard_analysis_jobs');

create index feedback_public_cursor_idx
  on public.feedback_posts(workspace_id, created_at desc, id desc)
  where visibility = 'published';
create index feedback_public_status_cursor_idx
  on public.feedback_posts(workspace_id, status, created_at desc, id desc)
  where visibility = 'published';
create index feedback_search_idx on public.feedback_posts using gin(search_document);
create index feedback_pending_embedding_idx
  on public.feedback_posts(workspace_id, updated_at, id)
  where embedding_state = 'pending';
create index feedback_duplicate_of_idx on public.feedback_posts(duplicate_of_id)
  where duplicate_of_id is not null;
create index feedback_import_idx on public.feedback_posts(import_id, import_row_index)
  where import_id is not null;
create index feedback_imports_workspace_idx on public.feedback_imports(workspace_id, created_at desc);
create index feedback_imports_creator_idx on public.feedback_imports(created_by);
create index duplicate_links_workspace_state_idx
  on public.feedback_duplicate_links(workspace_id, state, created_at desc);
create index duplicate_links_feedback_workspace_idx
  on public.feedback_duplicate_links(feedback_id, workspace_id);
create index duplicate_links_candidate_workspace_idx
  on public.feedback_duplicate_links(duplicate_id, workspace_id);
create index duplicate_links_reviewer_idx on public.feedback_duplicate_links(reviewed_by);
create index subscriptions_active_idx
  on public.feedback_subscriptions(workspace_id, feedback_id, user_id)
  where is_active;
create index subscriptions_user_idx on public.feedback_subscriptions(user_id);
create index comments_hidden_by_idx on public.feedback_comments(hidden_by)
  where hidden_by is not null;
create index email_outbox_pending_idx
  on private.email_outbox(available_at, id)
  where state in ('pending', 'failed') and attempts < 5;

create or replace function private.is_public_feedback(
  target_feedback_id uuid,
  target_workspace_id uuid
)
returns boolean
security definer
stable
language sql
set search_path = ''
as $$
  select exists(
    select 1
    from public.feedback_posts p
    where p.id = target_feedback_id
      and p.workspace_id = target_workspace_id
      and p.visibility = 'published'
      and private.is_public_board(p.board_id, p.workspace_id)
  );
$$;

grant execute on function private.is_public_feedback(uuid, uuid) to anon, authenticated;

drop policy feedback_read on public.feedback_posts;
create policy feedback_read on public.feedback_posts for select to anon, authenticated
  using (
    (visibility = 'published' and private.is_public_board(board_id, workspace_id))
    or private.is_workspace_member(workspace_id)
  );

drop policy votes_read on public.feedback_votes;
create policy votes_read on public.feedback_votes for select to anon, authenticated
  using (private.is_public_feedback(feedback_id, workspace_id) or private.is_workspace_member(workspace_id));

drop policy votes_create on public.feedback_votes;
create policy votes_create on public.feedback_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not private.is_demo_workspace(workspace_id)
    and private.is_public_feedback(feedback_id, workspace_id)
  );

drop policy comments_read on public.feedback_comments;
create policy comments_read on public.feedback_comments for select to anon, authenticated
  using (
    (not is_hidden and private.is_public_feedback(feedback_id, workspace_id))
    or private.is_workspace_member(workspace_id)
  );

drop policy comments_create on public.feedback_comments;
create policy comments_create on public.feedback_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not private.is_demo_workspace(workspace_id)
    and private.is_public_feedback(feedback_id, workspace_id)
  );

alter table public.feedback_imports enable row level security;
alter table public.feedback_duplicate_links enable row level security;
alter table public.feedback_subscriptions enable row level security;

create policy imports_read on public.feedback_imports for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy imports_insert on public.feedback_imports for insert to authenticated
  with check (created_by = (select auth.uid()) and private.is_workspace_editor(workspace_id));
create policy imports_update on public.feedback_imports for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id));

create policy duplicate_links_read on public.feedback_duplicate_links for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy duplicate_links_insert on public.feedback_duplicate_links for insert to authenticated
  with check (private.is_workspace_editor(workspace_id));
create policy duplicate_links_update on public.feedback_duplicate_links for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id));
create policy duplicate_links_delete on public.feedback_duplicate_links for delete to authenticated
  using (private.is_workspace_editor(workspace_id));

create policy subscriptions_read on public.feedback_subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or private.is_workspace_editor(workspace_id));
create policy subscriptions_insert on public.feedback_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_public_feedback(feedback_id, workspace_id));
create policy subscriptions_update on public.feedback_subscriptions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.feedback_imports to authenticated;
grant select, insert, update, delete on public.feedback_duplicate_links to authenticated;
grant select, insert, update on public.feedback_subscriptions to authenticated;

create or replace function private.consume_rate_limit(
  target_workspace_id uuid,
  action_name text,
  maximum_requests integer,
  period_seconds integer
)
returns void
security definer
volatile
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  bucket_start timestamptz;
  next_count integer;
begin
  if actor is null or private.is_workspace_editor(target_workspace_id) then
    return;
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / period_seconds) * period_seconds
  );

  insert into private.rate_limit_buckets(workspace_id, actor_id, action, window_start, request_count)
  values (target_workspace_id, actor, action_name, bucket_start, 1)
  on conflict (workspace_id, actor_id, action, window_start)
  do update set request_count = private.rate_limit_buckets.request_count + 1
  returning request_count into next_count;

  if next_count > maximum_requests then
    raise exception 'Rate limit exceeded for %', action_name using errcode = 'P0001';
  end if;
end;
$$;

create or replace function private.enforce_feedback_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.source = 'portal' and new.import_id is null then
    perform private.consume_rate_limit(new.workspace_id, 'feedback', 5, 3600);
  end if;
  return new;
end;
$$;

create or replace function private.enforce_comment_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.consume_rate_limit(new.workspace_id, 'comment', 30, 3600);
  return new;
end;
$$;

create or replace function private.enforce_vote_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.consume_rate_limit(coalesce(new.workspace_id, old.workspace_id), 'vote', 120, 3600);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger feedback_rate_limit before insert on public.feedback_posts
  for each row execute function private.enforce_feedback_rate_limit();
create trigger comment_rate_limit before insert on public.feedback_comments
  for each row execute function private.enforce_comment_rate_limit();
create trigger vote_rate_limit before insert or delete on public.feedback_votes
  for each row execute function private.enforce_vote_rate_limit();

create or replace function private.prepare_embedding_job()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.embedding := null;
  new.embedding_state := 'pending';
  if tg_table_name = 'feedback_posts' then
    new.embedding_error := null;
  end if;
  return new;
end;
$$;

create or replace function private.queue_embedding_job()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pgmq.send(
    queue_name => 'pulseboard_analysis_jobs',
    msg => jsonb_build_object(
      'id', new.id,
      'workspaceId', new.workspace_id,
      'entity', tg_table_name,
      'attempt', 0
    )
  );
  return new;
end;
$$;

create trigger prepare_feedback_embedding before insert or update of title, body
  on public.feedback_posts for each row execute function private.prepare_embedding_job();
create trigger queue_feedback_embedding after insert or update of title, body
  on public.feedback_posts for each row execute function private.queue_embedding_job();
create trigger prepare_theme_embedding before insert or update of name, description
  on public.themes for each row execute function private.prepare_embedding_job();
create trigger queue_theme_embedding after insert or update of name, description
  on public.themes for each row execute function private.queue_embedding_job();

create or replace function public.find_duplicate_suggestions(
  p_feedback_id uuid,
  p_threshold real default 0.86,
  p_count integer default 3
)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  insert into public.feedback_duplicate_links(
    workspace_id, feedback_id, duplicate_id, state, similarity
  )
  select p.workspace_id, p.id, candidate.id, 'suggested',
    (1 - (p.embedding <=> candidate.embedding))::real
  from public.feedback_posts p
  join public.feedback_posts candidate
    on candidate.workspace_id = p.workspace_id
   and candidate.id <> p.id
  where p.id = p_feedback_id
    and p.embedding is not null
    and candidate.embedding is not null
    and candidate.visibility = 'published'
    and 1 - (p.embedding <=> candidate.embedding) >= p_threshold
  order by p.embedding <=> candidate.embedding
  limit greatest(1, least(p_count, 3))
  on conflict (feedback_id, duplicate_id)
  do update set similarity = excluded.similarity
    where public.feedback_duplicate_links.state = 'suggested';
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

grant execute on function public.find_duplicate_suggestions(uuid, real, integer) to authenticated;

create or replace function private.queue_customer_email(
  event_name text,
  target_feedback_id uuid,
  event_payload jsonb,
  event_key text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into private.email_outbox(
    workspace_id, feedback_id, subscription_id, recipient,
    event_type, payload, idempotency_key
  )
  select s.workspace_id, s.feedback_id, s.id, s.email,
    event_name, event_payload, event_key || ':' || s.id::text
  from public.feedback_subscriptions s
  where s.feedback_id = target_feedback_id and s.is_active
  on conflict (idempotency_key) do nothing;
end;
$$;

create or replace function private.queue_status_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    perform private.queue_customer_email(
      case when new.status = 'shipped' then 'shipped' else 'status_changed' end,
      new.id,
      jsonb_build_object('title', new.title, 'oldStatus', old.status, 'status', new.status),
      'status:' || new.id::text || ':' || new.status::text || ':' || extract(epoch from new.updated_at)::bigint::text
    );
  end if;
  return new;
end;
$$;

create or replace function private.queue_staff_reply_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_staff and not new.is_hidden then
    perform private.queue_customer_email(
      'staff_reply', new.feedback_id,
      jsonb_build_object('commentId', new.id, 'body', new.body, 'author', new.author_name_snapshot),
      'reply:' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger queue_feedback_status_email after update of status on public.feedback_posts
  for each row execute function private.queue_status_email();
create trigger queue_staff_reply_email after insert on public.feedback_comments
  for each row execute function private.queue_staff_reply_email();

create or replace function public.claim_email_jobs(p_limit integer default 20)
returns table(
  id bigint, workspace_id uuid, feedback_id uuid, subscription_id uuid,
  recipient text, event_type text, payload jsonb, idempotency_key text, attempts smallint
)
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
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
  set state = 'processing', locked_at = now(), attempts = job.attempts + 1
  from claimed
  where job.id = claimed.id
  returning job.id, job.workspace_id, job.feedback_id, job.subscription_id,
    job.recipient, job.event_type, job.payload, job.idempotency_key, job.attempts;
end;
$$;

create or replace function public.complete_email_job(p_id bigint)
returns void language sql security definer set search_path = '' as $$
  update private.email_outbox set state = 'sent', sent_at = now(), locked_at = null
  where id = p_id and coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function public.fail_email_job(p_id bigint, p_error text)
returns void language sql security definer set search_path = '' as $$
  update private.email_outbox
  set state = case
        when attempts >= 5 then 'failed'::public.job_state
        else 'pending'::public.job_state
      end,
      available_at = now() + make_interval(secs => least(900, (2 ^ attempts)::integer * 15)),
      locked_at = null,
      last_error = left(p_error, 500)
  where id = p_id and coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

revoke all on function public.claim_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.complete_email_job(bigint) from public, anon, authenticated;
revoke all on function public.fail_email_job(bigint, text) from public, anon, authenticated;
grant execute on function public.claim_email_jobs(integer) to service_role;
grant execute on function public.complete_email_job(bigint) to service_role;
grant execute on function public.fail_email_job(bigint, text) to service_role;

-- Move the privileged invitation mutation out of the exposed API schema. The
-- public wrapper remains SECURITY INVOKER and can only call this hidden helper.
drop function if exists public.accept_workspace_invitation(text);

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
  where token_hash = p_token_hash and accepted_at is null and expires_at > now()
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

grant execute on function private.accept_workspace_invitation(text) to authenticated;

create function public.accept_workspace_invitation(p_token_hash text)
returns table(workspace_id uuid, role public.workspace_role)
language sql security invoker set search_path = '' as $$
  select * from private.accept_workspace_invitation(p_token_hash);
$$;

revoke all on function public.accept_workspace_invitation(text) from public, anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

create or replace view public.feedback_feed with (security_invoker = true) as
select
  p.id, p.workspace_id, p.board_id, p.title, p.body, p.source, p.status,
  p.embedding_state, p.created_at,
  coalesce(p.author_name_snapshot, 'Customer') as author_name,
  upper(left(coalesce(p.author_name_snapshot, 'C'), 1) || left(split_part(coalesce(p.author_name_snapshot, 'Customer'), ' ', 2), 1)) as author_initials,
  count(distinct v.id) as vote_count,
  count(distinct c.id) filter (where not c.is_hidden) as comment_count,
  (select l.theme_id from public.feedback_theme_links l
    where l.feedback_id = p.id and l.state = 'confirmed'
    order by l.reviewed_at nulls last, l.created_at limit 1) as confirmed_theme_id,
  p.visibility,
  p.duplicate_of_id
from public.feedback_posts p
left join public.feedback_votes v on v.feedback_id = p.id
left join public.feedback_comments c on c.feedback_id = p.id
group by p.id;

grant select on public.feedback_feed to anon, authenticated;
