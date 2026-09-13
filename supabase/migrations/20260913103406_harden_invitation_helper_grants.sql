-- The public SECURITY INVOKER wrapper is the only invitation endpoint exposed
-- through the Data API. Keep the privileged helper callable by authenticated
-- users (the wrapper's invoker), but remove the default PUBLIC/anon grant.
revoke execute on function private.accept_workspace_invitation(text)
  from public, anon;

grant execute on function private.accept_workspace_invitation(text)
  to authenticated;
