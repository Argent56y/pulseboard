-- pgvector is installed in the extensions schema. These functions deliberately
-- use an empty search_path, so the distance operator must be schema-qualified.

create or replace function public.find_theme_suggestions(
  p_feedback_id uuid,
  p_threshold real default 0.78,
  p_count integer default 5
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  insert into public.feedback_theme_links(
    workspace_id,
    feedback_id,
    theme_id,
    state,
    similarity
  )
  select
    feedback.workspace_id,
    feedback.id,
    theme.id,
    'suggested',
    (1 - (feedback.embedding operator(extensions.<=>) theme.embedding))::real
  from public.feedback_posts feedback
  join public.themes theme on theme.workspace_id = feedback.workspace_id
  where feedback.id = p_feedback_id
    and feedback.embedding is not null
    and theme.embedding is not null
    and 1 - (feedback.embedding operator(extensions.<=>) theme.embedding) >= p_threshold
  order by feedback.embedding operator(extensions.<=>) theme.embedding
  limit greatest(1, least(p_count, 5))
  on conflict (feedback_id, theme_id)
  do update set similarity = excluded.similarity
    where public.feedback_theme_links.state = 'suggested';

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.find_duplicate_suggestions(
  p_feedback_id uuid,
  p_threshold real default 0.86,
  p_count integer default 3
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  insert into public.feedback_duplicate_links(
    workspace_id,
    feedback_id,
    duplicate_id,
    state,
    similarity
  )
  select
    feedback.workspace_id,
    feedback.id,
    candidate.id,
    'suggested',
    (1 - (feedback.embedding operator(extensions.<=>) candidate.embedding))::real
  from public.feedback_posts feedback
  join public.feedback_posts candidate
    on candidate.workspace_id = feedback.workspace_id
   and candidate.id <> feedback.id
  where feedback.id = p_feedback_id
    and feedback.embedding is not null
    and candidate.embedding is not null
    and candidate.visibility = 'published'
    and 1 - (feedback.embedding operator(extensions.<=>) candidate.embedding) >= p_threshold
  order by feedback.embedding operator(extensions.<=>) candidate.embedding
  limit greatest(1, least(p_count, 3))
  on conflict (feedback_id, duplicate_id)
  do update set similarity = excluded.similarity
    where public.feedback_duplicate_links.state = 'suggested';

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
