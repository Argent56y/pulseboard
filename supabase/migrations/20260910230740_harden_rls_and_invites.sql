create schema if not exists private;

-- Trigger and policy helpers are implementation details. Keep them outside the
-- exposed API schema so they cannot be invoked directly through PostgREST.
revoke execute on all functions in schema public from public, anon, authenticated;

alter function public.handle_new_user() set schema private;
alter function public.bootstrap_workspace() set schema private;
alter function public.is_workspace_member(uuid) set schema private;
alter function public.is_workspace_editor(uuid) set schema private;
alter function public.is_workspace_owner(uuid) set schema private;
alter function public.is_public_workspace(uuid) set schema private;
alter function public.is_public_board(uuid, uuid) set schema private;
alter function public.is_demo_workspace(uuid) set schema private;

create or replace function private.is_public_board(target_board_id uuid, target_workspace_id uuid)
returns boolean
security definer
stable
language sql
set search_path = ''
as $$
  select exists(
    select 1
    from public.boards
    where id = target_board_id
      and workspace_id = target_workspace_id
      and is_public
  ) and private.is_public_workspace(target_workspace_id);
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_workspace_member(uuid) to anon, authenticated;
grant execute on function private.is_workspace_editor(uuid) to anon, authenticated;
grant execute on function private.is_workspace_owner(uuid) to anon, authenticated;
grant execute on function private.is_public_workspace(uuid) to anon, authenticated;
grant execute on function private.is_public_board(uuid, uuid) to anon, authenticated;
grant execute on function private.is_demo_workspace(uuid) to anon, authenticated;
grant execute on function public.find_theme_suggestions(uuid, real, integer) to authenticated;

-- A narrow authenticated RPC lets a member redeem a one-time hashed invite
-- without exposing invitation rows or a service-role key to the web app.
create or replace function public.accept_workspace_invitation(p_token_hash text)
returns table(workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.workspace_invitations%rowtype;
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into invite
  from public.workspace_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found or private.is_demo_workspace(invite.workspace_id) then
    raise exception 'Invitation is invalid or expired' using errcode = 'P0001';
  end if;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (invite.workspace_id, actor_id, invite.role)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = actor_id
  where id = invite.id;

  return query select invite.workspace_id, invite.role;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public, anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

-- Cover every foreign key in its declared column order.
create index changelog_entries_roadmap_workspace_idx on public.changelog_entries(roadmap_item_id, workspace_id);
create index feedback_comments_post_workspace_idx on public.feedback_comments(feedback_id, workspace_id);
create index feedback_posts_board_workspace_idx on public.feedback_posts(board_id, workspace_id);
create index feedback_theme_links_post_workspace_idx on public.feedback_theme_links(feedback_id, workspace_id);
create index feedback_theme_links_theme_workspace_idx on public.feedback_theme_links(theme_id, workspace_id);
create index feedback_votes_post_workspace_idx on public.feedback_votes(feedback_id, workspace_id);
create index roadmap_theme_links_item_workspace_idx on public.roadmap_theme_links(roadmap_item_id, workspace_id);
create index roadmap_theme_links_theme_workspace_idx on public.roadmap_theme_links(theme_id, workspace_id);
create index workspace_invitations_accepted_by_idx on public.workspace_invitations(accepted_by);
create index workspace_invitations_created_by_idx on public.workspace_invitations(created_by);
create index workspaces_created_by_idx on public.workspaces(created_by);

-- Split broad ALL policies so authenticated SELECT has only one permissive
-- policy per table. This keeps RLS evaluation predictable and inexpensive.
drop policy boards_manage on public.boards;
create policy boards_insert on public.boards for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy boards_update on public.boards for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy boards_delete on public.boards for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));

drop policy themes_manage on public.themes;
create policy themes_insert on public.themes for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy themes_update on public.themes for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy themes_delete on public.themes for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));

drop policy feedback_theme_links_manage on public.feedback_theme_links;
create policy feedback_theme_links_insert on public.feedback_theme_links for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy feedback_theme_links_update on public.feedback_theme_links for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy feedback_theme_links_delete on public.feedback_theme_links for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));

drop policy roadmap_manage on public.roadmap_items;
create policy roadmap_insert on public.roadmap_items for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy roadmap_update on public.roadmap_items for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy roadmap_delete on public.roadmap_items for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));

drop policy roadmap_theme_manage on public.roadmap_theme_links;
create policy roadmap_theme_insert on public.roadmap_theme_links for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy roadmap_theme_update on public.roadmap_theme_links for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy roadmap_theme_delete on public.roadmap_theme_links for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));

drop policy changelog_manage on public.changelog_entries;
create policy changelog_insert on public.changelog_entries for insert to authenticated
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy changelog_update on public.changelog_entries for update to authenticated
  using (private.is_workspace_editor(workspace_id))
  with check (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
create policy changelog_delete on public.changelog_entries for delete to authenticated
  using (private.is_workspace_editor(workspace_id) and not private.is_demo_workspace(workspace_id));
