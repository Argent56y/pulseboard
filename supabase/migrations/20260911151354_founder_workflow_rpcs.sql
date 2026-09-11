alter table public.workspace_invitations
  add column revoked_at timestamptz;

create index workspace_invitations_active_idx
  on public.workspace_invitations(workspace_id, expires_at desc)
  where accepted_at is null and revoked_at is null;

create or replace function private.shares_workspace(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = target_user_id
  );
$$;

grant execute on function private.shares_workspace(uuid) to authenticated;

create policy profiles_select_coworkers on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_workspace(id));

drop policy profiles_select_self on public.profiles;

create or replace function public.update_roadmap_status(
  p_item_id uuid,
  p_status public.roadmap_status,
  p_confirm boolean default false
)
returns table(updated boolean, affected_feedback integer)
language plpgsql security invoker set search_path = '' as $$
declare
  target_workspace_id uuid;
  affected integer;
begin
  select workspace_id into target_workspace_id
  from public.roadmap_items where id = p_item_id;
  if target_workspace_id is null or not private.is_workspace_editor(target_workspace_id) then
    raise exception 'Roadmap item not found' using errcode = '42501';
  end if;

  select count(distinct feedback.id)::integer into affected
  from public.roadmap_theme_links roadmap_link
  join public.feedback_theme_links theme_link
    on theme_link.theme_id = roadmap_link.theme_id
   and theme_link.workspace_id = roadmap_link.workspace_id
   and theme_link.state = 'confirmed'
  join public.feedback_posts feedback on feedback.id = theme_link.feedback_id
  where roadmap_link.roadmap_item_id = p_item_id
    and feedback.status not in ('closed', 'shipped')
    and feedback.visibility <> 'merged';

  if affected > 0 and not p_confirm then
    return query select false, affected;
    return;
  end if;

  update public.roadmap_items set status = p_status where id = p_item_id;
  update public.feedback_posts feedback
  set status = p_status::text::public.feedback_status
  from public.roadmap_theme_links roadmap_link
  join public.feedback_theme_links theme_link
    on theme_link.theme_id = roadmap_link.theme_id
   and theme_link.workspace_id = roadmap_link.workspace_id
   and theme_link.state = 'confirmed'
  where roadmap_link.roadmap_item_id = p_item_id
    and feedback.id = theme_link.feedback_id
    and feedback.status not in ('closed', 'shipped')
    and feedback.visibility <> 'merged';

  return query select true, affected;
end;
$$;

revoke all on function public.update_roadmap_status(uuid, public.roadmap_status, boolean) from public, anon;
grant execute on function public.update_roadmap_status(uuid, public.roadmap_status, boolean) to authenticated;

create or replace function public.get_feedback_detail(
  p_workspace_id uuid,
  p_feedback_id uuid
)
returns table(
  id uuid, workspace_id uuid, title text, body text, author_name text,
  source public.feedback_source, status public.feedback_status,
  visibility public.feedback_visibility, duplicate_of_id uuid,
  canonical_title text, embedding_state public.embedding_state,
  created_at timestamptz, vote_count bigint, comment_count bigint,
  voted_by_viewer boolean, confirmed_theme_id uuid
)
language sql stable security definer set search_path = '' as $$
  select post.id, post.workspace_id, post.title, post.body,
    coalesce(post.author_name_snapshot, 'Customer'), post.source, post.status,
    post.visibility, post.duplicate_of_id, canonical.title, post.embedding_state,
    post.created_at,
    (select count(*) from public.feedback_votes vote where vote.feedback_id = post.id),
    (select count(*) from public.feedback_comments comment where comment.feedback_id = post.id and not comment.is_hidden),
    exists(select 1 from public.feedback_votes viewer_vote where viewer_vote.feedback_id = post.id and viewer_vote.user_id = (select auth.uid())),
    (select link.theme_id from public.feedback_theme_links link where link.feedback_id = post.id and link.state = 'confirmed' order by link.reviewed_at nulls last, link.created_at limit 1)
  from public.feedback_posts post
  join public.workspaces workspace on workspace.id = post.workspace_id
  left join public.feedback_posts canonical on canonical.id = post.duplicate_of_id
  where post.workspace_id = p_workspace_id and post.id = p_feedback_id
    and ((workspace.is_public and post.visibility in ('published', 'merged')) or private.is_workspace_member(post.workspace_id));
$$;

revoke all on function public.get_feedback_detail(uuid, uuid) from public;
grant execute on function public.get_feedback_detail(uuid, uuid) to anon, authenticated;
