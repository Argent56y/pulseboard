-- Return the public roadmap together with a safe aggregate of published,
-- confirmed customer evidence. This avoids exposing private themes or hidden
-- feedback while keeping the public signal count accurate.

create or replace function private.list_roadmap_impl(p_workspace_id uuid)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  summary text,
  status public.roadmap_status,
  target_window text,
  theme_ids uuid[],
  feedback_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    item.id,
    item.workspace_id,
    item.title,
    item.summary,
    item.status,
    item.target_window,
    coalesce(
      array_agg(distinct roadmap_link.theme_id)
        filter (where roadmap_link.theme_id is not null),
      '{}'::uuid[]
    ) as theme_ids,
    count(distinct feedback.id)
      filter (where feedback.visibility = 'published') as feedback_count
  from public.roadmap_items item
  join public.workspaces workspace on workspace.id = item.workspace_id
  left join public.roadmap_theme_links roadmap_link
    on roadmap_link.roadmap_item_id = item.id
   and roadmap_link.workspace_id = item.workspace_id
  left join public.feedback_theme_links theme_link
    on theme_link.theme_id = roadmap_link.theme_id
   and theme_link.workspace_id = roadmap_link.workspace_id
   and theme_link.state = 'confirmed'
  left join public.feedback_posts feedback
    on feedback.id = theme_link.feedback_id
   and feedback.workspace_id = theme_link.workspace_id
  where item.workspace_id = p_workspace_id
    and (
      workspace.is_public
      or private.is_workspace_member(item.workspace_id)
    )
  group by item.id
  order by item.sort_order, item.created_at;
$$;

revoke all on function private.list_roadmap_impl(uuid) from public;
grant execute on function private.list_roadmap_impl(uuid) to anon, authenticated;

create or replace function public.list_roadmap(p_workspace_id uuid)
returns table(
  id uuid,
  workspace_id uuid,
  title text,
  summary text,
  status public.roadmap_status,
  target_window text,
  theme_ids uuid[],
  feedback_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_roadmap_impl(p_workspace_id);
$$;

revoke all on function public.list_roadmap(uuid) from public;
grant execute on function public.list_roadmap(uuid) to anon, authenticated;
