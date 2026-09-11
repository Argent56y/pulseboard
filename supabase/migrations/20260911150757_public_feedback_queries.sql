-- Public feedback is exposed through narrow aggregate RPCs so anonymous users
-- can see counts without receiving individual voter rows or author UUIDs.

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
      select 1 from public.feedback_votes viewer_vote
      where viewer_vote.feedback_id = post.id and viewer_vote.user_id = (select auth.uid())
    ),
    (
      select link.theme_id from public.feedback_theme_links link
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
security definer
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('english', trim(concat_ws(' ', p_title, p_body))) as value
  )
  select post.id, post.title, post.body, post.status,
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

revoke all on function public.list_feedback(uuid, text, public.feedback_status, timestamptz, uuid, integer) from public;
revoke all on function public.find_public_feedback_matches(uuid, text, text, integer) from public;
grant execute on function public.list_feedback(uuid, text, public.feedback_status, timestamptz, uuid, integer) to anon, authenticated;
grant execute on function public.find_public_feedback_matches(uuid, text, text, integer) to anon, authenticated;

revoke select on public.feedback_votes from anon;
revoke select on public.feedback_feed from anon;
revoke select on public.feedback_comments from anon;
grant select (id, workspace_id, feedback_id, author_name_snapshot, body, is_staff, created_at)
  on public.feedback_comments to anon;
