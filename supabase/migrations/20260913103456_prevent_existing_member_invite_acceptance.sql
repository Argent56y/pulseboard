create or replace function private.accept_workspace_invitation(p_token_hash text)
returns table(workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.workspace_invitations%rowtype;
  actor_id uuid := (select auth.uid());
  inserted_members integer;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into invite
  from public.workspace_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  for update;

  if not found or private.is_demo_workspace(invite.workspace_id) then
    raise exception 'Invitation is invalid or expired' using errcode = 'P0001';
  end if;

  -- An invite is for a new workspace member. In particular, an owner opening
  -- an editor link must never be downgraded by the conflict handler.
  insert into public.workspace_members(workspace_id, user_id, role)
  values (invite.workspace_id, actor_id, invite.role)
  on conflict (workspace_id, user_id) do nothing;

  get diagnostics inserted_members = row_count;
  if inserted_members <> 1 then
    raise exception 'Already a workspace member' using errcode = 'P0001';
  end if;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = actor_id
  where id = invite.id;

  return query select invite.workspace_id, invite.role;
end;
$$;

revoke execute on function private.accept_workspace_invitation(text)
  from public, anon;

grant execute on function private.accept_workspace_invitation(text)
  to authenticated;
