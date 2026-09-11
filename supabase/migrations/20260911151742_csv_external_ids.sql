alter table public.feedback_posts add column external_id text;

create unique index feedback_external_id_unique_idx
  on public.feedback_posts(workspace_id, external_id)
  where external_id is not null;
