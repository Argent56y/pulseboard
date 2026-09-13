begin;
select plan(17);

select has_table('public', 'workspaces', 'workspaces exists');
select has_table('public', 'feedback_posts', 'feedback_posts exists');
select has_table('public', 'feedback_votes', 'feedback_votes exists');
select has_table('public', 'feedback_theme_links', 'feedback_theme_links exists');
select has_table('public', 'roadmap_items', 'roadmap_items exists');
select has_table('public', 'changelog_entries', 'changelog_entries exists');

select col_is_pk('public', 'workspaces', 'id', 'workspace ids are primary keys');
select col_is_pk('public', 'feedback_posts', 'id', 'feedback ids are primary keys');
select col_is_pk('public', 'roadmap_items', 'id', 'roadmap ids are primary keys');

select ok((select relrowsecurity from pg_class where oid = 'public.feedback_posts'::regclass), 'feedback RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.workspace_members'::regclass), 'membership RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.workspace_invitations'::regclass), 'invitation RLS is enabled');
select has_constraint('public', 'feedback_votes', 'feedback_votes_feedback_id_user_id_key', 'one vote per user and feedback');

select ok(
  not has_function_privilege('anon', 'public.accept_workspace_invitation(text)', 'execute'),
  'anonymous users cannot accept invitations'
);
select ok(
  has_function_privilege('authenticated', 'public.accept_workspace_invitation(text)', 'execute'),
  'authenticated users can call the invitation wrapper'
);
select ok(
  not has_function_privilege('anon', 'private.accept_workspace_invitation(text)', 'execute'),
  'anonymous users cannot call the privileged invitation helper'
);
select ok(
  not (
    select p.prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'accept_workspace_invitation'
  ),
  'the public invitation wrapper runs as security invoker'
);

select * from finish();
rollback;
