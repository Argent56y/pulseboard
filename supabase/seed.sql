insert into public.workspaces(id, name, slug, description, is_public, is_demo, created_by)
values ('11111111-1111-4111-8111-111111111111', 'Northstar', 'demo', 'A shared command center for remote product teams.', true, true, null)
on conflict (id) do nothing;

insert into public.boards(id, workspace_id, title, slug, is_public)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Product feedback', 'feedback', true)
on conflict (id) do nothing;

insert into public.themes(id, workspace_id, name, description, embedding_state) values
  ('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Faster onboarding', 'Help new teams reach their first useful workspace sooner.', 'pending'),
  ('40000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Team permissions', 'Give growing teams safer, clearer access controls.', 'pending'),
  ('40000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Mobile workflow', 'Keep projects moving while people are away from a desk.', 'pending'),
  ('40000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Reports & exports', 'Turn workspace activity into useful stakeholder updates.', 'pending'),
  ('40000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Connected tools', 'Bring feedback and decisions in from existing workflows.', 'pending'),
  ('40000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Trust & reliability', 'Make changes predictable, recoverable and transparent.', 'pending')
on conflict (id) do nothing;

with sample as (
  select
    i,
    (array[
      'A guided setup for first-time teams','Let me invite people during onboarding','Show a sample project after signup',
      'Role-based access for contractors','Approval step before publishing','Read-only stakeholder seats',
      'Quick capture from mobile','Mobile push for status changes','Offline notes on customer visits',
      'Export roadmap as a clean PDF','Weekly stakeholder digest','CSV export with filters applied',
      'Capture feedback from Slack','Link roadmap items to Linear','Import Intercom conversations',
      'An audit trail for status changes','Undo accidental merges','Visible analysis status',
      'Checklist for workspace launch','Explain why a theme was suggested','Guest access that expires',
      'Different editors per board','Swipe through the feedback inbox','Share a live filtered report',
      'Notion sync for research notes','Webhook when a feature ships','Restore archived feedback',
      'Invite templates for common roles','Onboarding progress that persists','Add feedback from the share sheet',
      'Quarterly trend comparison','Keep source links after import','Warn before deleting a theme',
      'Personal setup recommendations','Fast search on small screens','Scheduled exports'
    ]::text[])[i] as title,
    (array['portal','interview','support','email']::public.feedback_source[])[1 + ((i - 1) % 4)] as source,
    (array['new','under_review','planned','under_review','new','shipped']::public.feedback_status[])[1 + ((i - 1) % 6)] as status,
    case
      when i in (1,2,3,19,20,29,34) then '40000000-0000-4000-8000-000000000001'::uuid
      when i in (4,5,6,21,22,28) then '40000000-0000-4000-8000-000000000002'::uuid
      when i in (7,8,9,23,30,35) then '40000000-0000-4000-8000-000000000003'::uuid
      when i in (10,11,12,24,31,36) then '40000000-0000-4000-8000-000000000004'::uuid
      when i in (13,14,15,25,26,32) then '40000000-0000-4000-8000-000000000005'::uuid
      else '40000000-0000-4000-8000-000000000006'::uuid
    end as theme_id
  from generate_series(1, 36) as i
), inserted as (
  insert into public.feedback_posts(id, workspace_id, board_id, author_name_snapshot, title, body, source, status, embedding_state, created_at)
  select
    ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'Sample customer ' || lpad(i::text, 2, '0'),
    title,
    'A realistic imported customer note about ' || lower(title) || '. The team needs this workflow to stay clear, fast and trustworthy.',
    source,
    status,
    case when i = 35 then 'pending'::public.embedding_state else 'ready'::public.embedding_state end,
    now() - make_interval(days => i)
  from sample
  on conflict (id) do nothing
  returning id
)
insert into public.feedback_theme_links(id, workspace_id, feedback_id, theme_id, state, similarity)
select
  ('41000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  theme_id,
  case when i in (20,34) then 'suggested'::public.link_state else 'confirmed'::public.link_state end,
  (0.79 + ((i * 7) % 18)::real / 100)::real
from sample
on conflict (feedback_id, theme_id) do nothing;

insert into public.roadmap_items(id, workspace_id, title, summary, status, target_window, sort_order) values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Controlled collaboration', 'Granular roles, approvals and time-limited guest access for growing teams.', 'in_progress', 'September 2026', 1),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Guided first workspace', 'A contextual setup path that adapts to team size and working style.', 'planned', 'October 2026', 2),
  ('50000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Mobile command center', 'Fast capture, triage and updates from a focused mobile workflow.', 'planned', 'Q4 2026', 3),
  ('50000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Shareable reporting', 'Filtered exports, stakeholder-ready PDFs and clearer trend reporting.', 'shipped', 'August 2026', 4)
on conflict (id) do nothing;

insert into public.roadmap_theme_links(workspace_id, roadmap_item_id, theme_id) values
  ('11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003'),
  ('11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004')
on conflict do nothing;

insert into public.changelog_entries(id, workspace_id, roadmap_item_id, title, body, published_at) values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000004', 'Reports that are ready to share', 'Export the exact view you are looking at, or generate a stakeholder-ready roadmap PDF without rebuilding it in slides.', now() - interval '14 days'),
  ('60000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', null, 'A quieter, faster feedback inbox', 'Keyboard navigation, saved filters and clearer source context make daily triage faster for small product teams.', now() - interval '29 days'),
  ('60000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', null, 'Every roadmap item now keeps its evidence', 'Open any roadmap item to see the themes and customer language that shaped the decision.', now() - interval '43 days')
on conflict (id) do nothing;
