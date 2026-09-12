-- Cover the referencing side of every foreign key reported by the database
-- advisor. Composite indexes follow the foreign-key column order.

create index if not exists email_outbox_feedback_id_idx
  on private.email_outbox (feedback_id);

create index if not exists email_outbox_subscription_id_idx
  on private.email_outbox (subscription_id);

create index if not exists email_outbox_workspace_id_idx
  on private.email_outbox (workspace_id);

create index if not exists rate_limit_buckets_actor_id_idx
  on private.rate_limit_buckets (actor_id);

create index if not exists feedback_posts_import_workspace_idx
  on public.feedback_posts (import_id, workspace_id)
  where import_id is not null;

create index if not exists feedback_subscriptions_feedback_workspace_idx
  on public.feedback_subscriptions (feedback_id, workspace_id);
