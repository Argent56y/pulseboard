begin;
select plan(12);

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
select has_constraint('public', 'feedback_votes', 'feedback_votes_feedback_id_user_id_key', 'one vote per user and feedback');

select * from finish();
rollback;
