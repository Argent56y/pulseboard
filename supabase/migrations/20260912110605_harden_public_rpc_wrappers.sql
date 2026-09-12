-- Keep privileged implementations outside the exposed public schema. Public
-- wrappers remain SECURITY INVOKER endpoints with deliberately narrow output.

create or replace function private.list_feedback_impl(
  p_workspace_id uuid,
  p_query text default null,
  p_status public.feedback_status default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 20
)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  body text,
  author_name text,
  source public.feedback_source,
  status public.feedback_status,
  visibility public.feedback_visibility,
  duplicate_of_id uuid,
  canonical_title text,
  embedding_state public.embedding_state,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
  voted_by_viewer boolean,
  confirmed_theme_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    post.id,
    post.workspace_id,
    post.title,
    post.body,
    coalesce(post.author_name_snapshot, 'Customer'),
    post.source,
    post.status,
    post.visibility,
    post.duplicate_of_id,
    canonical.title,
    post.embedding_state,
    post.created_at,
    (select count(*) from public.feedback_votes vote where vote.feedback_id = post.id),
    (select count(*) from public.feedback_comments comment where comment.feedback_id = post.id and not comment.is_hidden),
    exists(
      select 1
      from public.feedback_votes viewer_vote
      where viewer_vote.feedback_id = post.id
        and viewer_vote.user_id = (select auth.uid())
    ),
    (
      select link.theme_id
      from public.feedback_theme_links link
      where link.feedback_id = post.id and link.state = 'confirmed'
      order by link.reviewed_at nulls last, link.created_at
      limit 1
    )
  from public.feedback_posts post
  join public.workspaces workspace on workspace.id = post.workspace_id
  left join public.feedback_posts canonical on canonical.id = post.duplicate_of_id
  where post.workspace_id = p_workspace_id
    and (
      (workspace.is_public and post.visibility in ('published', 'merged'))
      or private.is_workspace_member(post.workspace_id)
    )
    and (p_status is null or post.status = p_status)
    and (
      nullif(trim(p_query), '') is null
      or post.search_document @@ websearch_to_tsquery('english', trim(p_query))
    )
    and (
      p_cursor_created_at is null
      or (post.created_at, post.id) < (p_cursor_created_at, p_cursor_id)
    )
  order by post.created_at desc, post.id desc
  limit greatest(1, least(p_limit, 50));
$$;

revoke all on function private.list_feedback_impl(uuid, text, public.feedback_status, timestamptz, uuid, integer) from public;
grant execute on function private.list_feedback_impl(uuid, text, public.feedback_status, timestamptz, uuid, integer) to anon, authenticated;

create or replace function public.list_feedback(
  p_workspace_id uuid,
  p_query text default null,
  p_status public.feedback_status default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 20
)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  body text,
  author_name text,
  source public.feedback_source,
  status public.feedback_status,
  visibility public.feedback_visibility,
  duplicate_of_id uuid,
  canonical_title text,
  embedding_state public.embedding_state,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
  voted_by_viewer boolean,
  confirmed_theme_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_feedback_impl(
    p_workspace_id,
    p_query,
    p_status,
    p_cursor_created_at,
    p_cursor_id,
    p_limit
  );
$$;

revoke all on function public.list_feedback(uuid, text, public.feedback_status, timestamptz, uuid, integer) from public;
grant execute on function public.list_feedback(uuid, text, public.feedback_status, timestamptz, uuid, integer) to anon, authenticated;

create or replace function private.find_public_feedback_matches_impl(
  p_workspace_id uuid,
  p_title text,
  p_body text,
  p_limit integer default 3
)
returns table(
  id uuid,
  title text,
  body text,
  status public.feedback_status,
  vote_count bigint,
  rank real
)
language sql
stable
security definer
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('english', trim(concat_ws(' ', p_title, p_body))) as value
  )
  select
    post.id,
    post.title,
    post.body,
    post.status,
    (select count(*) from public.feedback_votes vote where vote.feedback_id = post.id),
    ts_rank_cd(post.search_document, query.value)::real
  from public.feedback_posts post
  join public.workspaces workspace on workspace.id = post.workspace_id
  cross join query
  where post.workspace_id = p_workspace_id
    and workspace.is_public
    and post.visibility = 'published'
    and post.search_document @@ query.value
  order by ts_rank_cd(post.search_document, query.value) desc, post.created_at desc
  limit greatest(1, least(p_limit, 3));
$$;

revoke all on function private.find_public_feedback_matches_impl(uuid, text, text, integer) from public;
grant execute on function private.find_public_feedback_matches_impl(uuid, text, text, integer) to anon, authenticated;

create or replace function public.find_public_feedback_matches(
  p_workspace_id uuid,
  p_title text,
  p_body text,
  p_limit integer default 3
)
returns table(
  id uuid,
  title text,
  body text,
  status public.feedback_status,
  vote_count bigint,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.find_public_feedback_matches_impl(p_workspace_id, p_title, p_body, p_limit);
$$;

revoke all on function public.find_public_feedback_matches(uuid, text, text, integer) from public;
grant execute on function public.find_public_feedback_matches(uuid, text, text, integer) to anon, authenticated;

create or replace function private.get_feedback_detail_impl(
  p_workspace_id uuid,
  p_feedback_id uuid
)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  body text,
  author_name text,
  source public.feedback_source,
  status public.feedback_status,
  visibility public.feedback_visibility,
  duplicate_of_id uuid,
  canonical_title text,
  embedding_state public.embedding_state,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
  voted_by_viewer boolean,
  confirmed_theme_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    post.id,
    post.workspace_id,
    post.title,
    post.body,
    coalesce(post.author_name_snapshot, 'Customer'),
    post.source,
    post.status,
    post.visibility,
    post.duplicate_of_id,
    canonical.title,
    post.embedding_state,
    post.created_at,
    (select count(*) from public.feedback_votes vote where vote.feedback_id = post.id),
    (select count(*) from public.feedback_comments comment where comment.feedback_id = post.id and not comment.is_hidden),
    exists(
      select 1
      from public.feedback_votes viewer_vote
      where viewer_vote.feedback_id = post.id
        and viewer_vote.user_id = (select auth.uid())
    ),
    (
      select link.theme_id
      from public.feedback_theme_links link
      where link.feedback_id = post.id and link.state = 'confirmed'
      order by link.reviewed_at nulls last, link.created_at
      limit 1
    )
  from public.feedback_posts post
  join public.workspaces workspace on workspace.id = post.workspace_id
  left join public.feedback_posts canonical on canonical.id = post.duplicate_of_id
  where post.workspace_id = p_workspace_id
    and post.id = p_feedback_id
    and (
      (workspace.is_public and post.visibility in ('published', 'merged'))
      or private.is_workspace_member(post.workspace_id)
    );
$$;

revoke all on function private.get_feedback_detail_impl(uuid, uuid) from public;
grant execute on function private.get_feedback_detail_impl(uuid, uuid) to anon, authenticated;

create or replace function public.get_feedback_detail(
  p_workspace_id uuid,
  p_feedback_id uuid
)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  body text,
  author_name text,
  source public.feedback_source,
  status public.feedback_status,
  visibility public.feedback_visibility,
  duplicate_of_id uuid,
  canonical_title text,
  embedding_state public.embedding_state,
  created_at timestamptz,
  vote_count bigint,
  comment_count bigint,
  voted_by_viewer boolean,
  confirmed_theme_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_feedback_detail_impl(p_workspace_id, p_feedback_id);
$$;

revoke all on function public.get_feedback_detail(uuid, uuid) from public;
grant execute on function public.get_feedback_detail(uuid, uuid) to anon, authenticated;

create or replace function private.validate_worker_secret_impl(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from vault.decrypted_secrets secret
    where secret.name = 'pulseboard_queue_secret'
      and extensions.digest(coalesce(p_secret, ''), 'sha256') = extensions.digest(secret.decrypted_secret, 'sha256')
  );
$$;

revoke all on function private.validate_worker_secret_impl(text) from public;
grant execute on function private.validate_worker_secret_impl(text) to anon, service_role;

create or replace function public.validate_worker_secret(p_secret text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.validate_worker_secret_impl(p_secret);
$$;

revoke all on function public.validate_worker_secret(text) from public, authenticated;
grant execute on function public.validate_worker_secret(text) to anon, service_role;

create or replace function private.unsubscribe_feedback_impl(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  subscription_id uuid;
  supplied_signature text;
  expected_signature text;
  secret text;
  changed integer;
begin
  if p_token !~* '^[0-9a-f-]{36}\.[0-9a-f]{64}$' then
    return false;
  end if;

  subscription_id := split_part(p_token, '.', 1)::uuid;
  supplied_signature := split_part(p_token, '.', 2);
  select decrypted_secret
  into secret
  from vault.decrypted_secrets
  where name = 'pulseboard_queue_secret';

  expected_signature := encode(
    extensions.hmac(
      convert_to(subscription_id::text, 'utf8'),
      convert_to(secret, 'utf8'),
      'sha256'
    ),
    'hex'
  );

  if supplied_signature <> expected_signature then
    return false;
  end if;

  update public.feedback_subscriptions
  set is_active = false, unsubscribed_at = now()
  where id = subscription_id and is_active;

  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function private.unsubscribe_feedback_impl(text) from public;
grant execute on function private.unsubscribe_feedback_impl(text) to anon, service_role;

create or replace function public.unsubscribe_feedback(p_token text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.unsubscribe_feedback_impl(p_token);
$$;

revoke all on function public.unsubscribe_feedback(text) from public, authenticated;
grant execute on function public.unsubscribe_feedback(text) to anon, service_role;
