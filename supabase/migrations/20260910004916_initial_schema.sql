create extension if not exists vector with schema extensions;

create type public.workspace_role as enum ('owner', 'editor');
create type public.feedback_source as enum ('portal', 'email', 'interview', 'support');
create type public.feedback_status as enum ('new', 'under_review', 'planned', 'in_progress', 'shipped', 'closed');
create type public.roadmap_status as enum ('planned', 'in_progress', 'shipped');
create type public.link_state as enum ('suggested', 'confirmed', 'rejected');
create type public.embedding_state as enum ('pending', 'ready', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  is_public boolean not null default true,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_demo and created_by is null) or (not is_demo and created_by is not null))
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role public.workspace_role not null default 'editor',
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  slug text not null default 'feedback' check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug),
  unique (id, workspace_id)
);

create table public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  board_id uuid not null,
  author_id uuid references auth.users(id) on delete set null,
  author_name_snapshot text,
  title text not null check (char_length(title) between 6 and 120),
  body text not null check (char_length(body) between 12 and 2000),
  source public.feedback_source not null default 'portal',
  status public.feedback_status not null default 'new',
  embedding extensions.vector(384),
  embedding_state public.embedding_state not null default 'pending',
  embedding_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_board_workspace_fk foreign key (board_id, workspace_id) references public.boards(id, workspace_id) on delete cascade,
  unique (id, workspace_id)
);

create table public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint feedback_vote_post_fk foreign key (feedback_id, workspace_id) references public.feedback_posts(id, workspace_id) on delete cascade,
  unique (feedback_id, user_id)
);

create table public.feedback_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid not null,
  author_id uuid references auth.users(id) on delete set null,
  author_name_snapshot text,
  body text not null check (char_length(body) between 2 and 1000),
  is_staff boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_comment_post_fk foreign key (feedback_id, workspace_id) references public.feedback_posts(id, workspace_id) on delete cascade
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  description text not null check (char_length(description) between 8 and 500),
  embedding extensions.vector(384),
  embedding_state public.embedding_state not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name),
  unique (id, workspace_id)
);

create table public.feedback_theme_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  feedback_id uuid not null,
  theme_id uuid not null,
  state public.link_state not null default 'suggested',
  similarity real not null check (similarity between 0 and 1),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint feedback_theme_post_fk foreign key (feedback_id, workspace_id) references public.feedback_posts(id, workspace_id) on delete cascade,
  constraint feedback_theme_theme_fk foreign key (theme_id, workspace_id) references public.themes(id, workspace_id) on delete cascade,
  unique (feedback_id, theme_id)
);

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  summary text not null check (char_length(summary) between 12 and 1000),
  status public.roadmap_status not null default 'planned',
  target_window text not null default 'Later',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table public.roadmap_theme_links (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roadmap_item_id uuid not null,
  theme_id uuid not null,
  created_at timestamptz not null default now(),
  constraint roadmap_theme_item_fk foreign key (roadmap_item_id, workspace_id) references public.roadmap_items(id, workspace_id) on delete cascade,
  constraint roadmap_theme_theme_fk foreign key (theme_id, workspace_id) references public.themes(id, workspace_id) on delete cascade,
  primary key (roadmap_item_id, theme_id)
);

create table public.changelog_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roadmap_item_id uuid,
  title text not null check (char_length(title) between 4 and 120),
  body text not null check (char_length(body) between 12 and 4000),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint changelog_roadmap_fk foreign key (roadmap_item_id, workspace_id) references public.roadmap_items(id, workspace_id) on delete set null (roadmap_item_id)
);

create index workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id, expires_at);
create index boards_workspace_idx on public.boards(workspace_id, is_public);
create index feedback_posts_workspace_status_cursor_idx on public.feedback_posts(workspace_id, status, created_at desc, id desc);
create index feedback_posts_board_cursor_idx on public.feedback_posts(board_id, created_at desc, id desc);
create index feedback_posts_author_idx on public.feedback_posts(author_id);
create index feedback_votes_workspace_idx on public.feedback_votes(workspace_id);
create index feedback_votes_user_idx on public.feedback_votes(user_id);
create index feedback_comments_post_cursor_idx on public.feedback_comments(feedback_id, created_at, id);
create index feedback_comments_workspace_idx on public.feedback_comments(workspace_id);
create index feedback_comments_author_idx on public.feedback_comments(author_id);
create index themes_workspace_idx on public.themes(workspace_id, created_at desc);
create index feedback_theme_links_workspace_state_idx on public.feedback_theme_links(workspace_id, state);
create index feedback_theme_links_theme_idx on public.feedback_theme_links(theme_id);
create index feedback_theme_links_reviewer_idx on public.feedback_theme_links(reviewed_by);
create index roadmap_items_workspace_status_idx on public.roadmap_items(workspace_id, status, sort_order);
create index roadmap_theme_links_workspace_idx on public.roadmap_theme_links(workspace_id);
create index roadmap_theme_links_theme_idx on public.roadmap_theme_links(theme_id);
create index changelog_entries_workspace_cursor_idx on public.changelog_entries(workspace_id, published_at desc, id desc);
create index changelog_entries_roadmap_idx on public.changelog_entries(roadmap_item_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger boards_updated_at before update on public.boards for each row execute function public.set_updated_at();
create trigger feedback_posts_updated_at before update on public.feedback_posts for each row execute function public.set_updated_at();
create trigger feedback_comments_updated_at before update on public.feedback_comments for each row execute function public.set_updated_at();
create trigger themes_updated_at before update on public.themes for each row execute function public.set_updated_at();
create trigger roadmap_items_updated_at before update on public.roadmap_items for each row execute function public.set_updated_at();
create trigger changelog_entries_updated_at before update on public.changelog_entries for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger security definer language plpgsql set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'Member'), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.bootstrap_workspace()
returns trigger security definer language plpgsql set search_path = '' as $$
begin
  if not new.is_demo then
    insert into public.workspace_members(workspace_id, user_id, role) values (new.id, new.created_by, 'owner');
    insert into public.boards(workspace_id, title, slug, is_public) values (new.id, 'Product feedback', 'feedback', true);
  end if;
  return new;
end;
$$;
create trigger on_workspace_created after insert on public.workspaces for each row execute function public.bootstrap_workspace();

create or replace function public.fill_feedback_author_name()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.author_name_snapshot is null and new.author_id is not null then
    select display_name into new.author_name_snapshot from public.profiles where id = new.author_id;
  end if;
  return new;
end;
$$;
create trigger feedback_author_snapshot before insert on public.feedback_posts for each row execute function public.fill_feedback_author_name();

create or replace function public.fill_comment_author_name()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.author_name_snapshot is null and new.author_id is not null then
    select display_name into new.author_name_snapshot from public.profiles where id = new.author_id;
  end if;
  return new;
end;
$$;
create trigger comment_author_snapshot before insert on public.feedback_comments for each row execute function public.fill_comment_author_name();

create or replace function public.fill_vote_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  select workspace_id into new.workspace_id from public.feedback_posts where id = new.feedback_id;
  return new;
end;
$$;
create trigger feedback_vote_workspace before insert on public.feedback_votes for each row execute function public.fill_vote_workspace();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = (select auth.uid()));
$$;
create or replace function public.is_workspace_editor(target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = (select auth.uid()) and role in ('owner', 'editor'));
$$;
create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = (select auth.uid()) and role = 'owner');
$$;
create or replace function public.is_public_workspace(target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.workspaces where id = target_workspace_id and is_public);
$$;
create or replace function public.is_public_board(target_board_id uuid, target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.boards where id = target_board_id and workspace_id = target_workspace_id and is_public)
    and public.is_public_workspace(target_workspace_id);
$$;
create or replace function public.is_demo_workspace(target_workspace_id uuid)
returns boolean security definer stable language sql set search_path = '' as $$
  select exists(select 1 from public.workspaces where id = target_workspace_id and is_demo);
$$;

create view public.feedback_feed with (security_invoker = true) as
select
  p.id, p.workspace_id, p.board_id, p.title, p.body, p.source, p.status, p.embedding_state, p.created_at,
  coalesce(p.author_name_snapshot, 'Customer') as author_name,
  upper(left(coalesce(p.author_name_snapshot, 'C'), 1) || left(split_part(coalesce(p.author_name_snapshot, 'Customer'), ' ', 2), 1)) as author_initials,
  count(distinct v.id) as vote_count,
  count(distinct c.id) as comment_count,
  null::uuid as confirmed_theme_id
from public.feedback_posts p
left join public.feedback_votes v on v.feedback_id = p.id
left join public.feedback_comments c on c.feedback_id = p.id
group by p.id;

create view public.theme_summary with (security_invoker = true) as
select
  t.id, t.workspace_id, t.name, t.description,
  count(l.id) filter (where l.state = 'confirmed')::integer as signal_count,
  0::integer as velocity
from public.themes t
left join public.feedback_theme_links l on l.theme_id = t.id
group by t.id;

create or replace function public.find_theme_suggestions(p_feedback_id uuid, p_threshold real default 0.78, p_count integer default 5)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  insert into public.feedback_theme_links(workspace_id, feedback_id, theme_id, state, similarity)
  select p.workspace_id, p.id, t.id, 'suggested', (1 - (p.embedding <=> t.embedding))::real
  from public.feedback_posts p
  join public.themes t on t.workspace_id = p.workspace_id
  where p.id = p_feedback_id and p.embedding is not null and t.embedding is not null
    and 1 - (p.embedding <=> t.embedding) >= p_threshold
  order by p.embedding <=> t.embedding
  limit greatest(1, least(p_count, 5))
  on conflict (feedback_id, theme_id) do update set similarity = excluded.similarity
    where public.feedback_theme_links.state = 'suggested';
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.boards enable row level security;
alter table public.feedback_posts enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_comments enable row level security;
alter table public.themes enable row level security;
alter table public.feedback_theme_links enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.roadmap_theme_links enable row level security;
alter table public.changelog_entries enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy workspaces_read on public.workspaces for select to anon, authenticated using (is_public or public.is_workspace_member(id));
create policy workspaces_create on public.workspaces for insert to authenticated with check (created_by = (select auth.uid()) and not is_demo);
create policy workspaces_update on public.workspaces for update to authenticated using (public.is_workspace_owner(id)) with check (public.is_workspace_owner(id) and not is_demo);
create policy workspaces_delete on public.workspaces for delete to authenticated using (public.is_workspace_owner(id) and not is_demo);

create policy members_read on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy members_create_first_or_owner on public.workspace_members for insert to authenticated with check (
  (user_id = (select auth.uid()) and exists(select 1 from public.workspaces w where w.id = workspace_id and w.created_by = (select auth.uid())))
  or public.is_workspace_owner(workspace_id)
);
create policy members_update_owner on public.workspace_members for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy members_delete_owner on public.workspace_members for delete to authenticated using (public.is_workspace_owner(workspace_id));

create policy invitations_owner_all on public.workspace_invitations for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id) and not public.is_demo_workspace(workspace_id));

create policy boards_read on public.boards for select to anon, authenticated using (public.is_public_board(id, workspace_id) or public.is_workspace_member(workspace_id));
create policy boards_manage on public.boards for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));

create policy feedback_read on public.feedback_posts for select to anon, authenticated using (public.is_public_board(board_id, workspace_id) or public.is_workspace_member(workspace_id));
create policy feedback_create on public.feedback_posts for insert to authenticated with check (
  not public.is_demo_workspace(workspace_id) and (
    (author_id = (select auth.uid()) and public.is_public_board(board_id, workspace_id))
    or public.is_workspace_editor(workspace_id)
  )
);
create policy feedback_update on public.feedback_posts for update to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));
create policy feedback_delete on public.feedback_posts for delete to authenticated using (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));

create policy votes_read on public.feedback_votes for select to anon, authenticated using (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id));
create policy votes_create on public.feedback_votes for insert to authenticated with check (user_id = (select auth.uid()) and not public.is_demo_workspace(workspace_id) and (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id)));
create policy votes_delete_own on public.feedback_votes for delete to authenticated using (user_id = (select auth.uid()) and not public.is_demo_workspace(workspace_id));

create policy comments_read on public.feedback_comments for select to anon, authenticated using (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id));
create policy comments_create on public.feedback_comments for insert to authenticated with check (author_id = (select auth.uid()) and not public.is_demo_workspace(workspace_id) and (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id)));
create policy comments_update_own on public.feedback_comments for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()) and not public.is_demo_workspace(workspace_id));
create policy comments_delete_own_or_editor on public.feedback_comments for delete to authenticated using ((author_id = (select auth.uid()) or public.is_workspace_editor(workspace_id)) and not public.is_demo_workspace(workspace_id));

create policy themes_read on public.themes for select to authenticated using (public.is_workspace_member(workspace_id));
create policy themes_manage on public.themes for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));
create policy feedback_theme_links_read on public.feedback_theme_links for select to authenticated using (public.is_workspace_member(workspace_id));
create policy feedback_theme_links_manage on public.feedback_theme_links for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));

create policy roadmap_read on public.roadmap_items for select to anon, authenticated using (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id));
create policy roadmap_manage on public.roadmap_items for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));
create policy roadmap_theme_read on public.roadmap_theme_links for select to anon, authenticated using (public.is_public_workspace(workspace_id) or public.is_workspace_member(workspace_id));
create policy roadmap_theme_manage on public.roadmap_theme_links for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));

create policy changelog_read on public.changelog_entries for select to anon, authenticated using ((published_at is not null and public.is_public_workspace(workspace_id)) or public.is_workspace_member(workspace_id));
create policy changelog_manage on public.changelog_entries for all to authenticated using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id) and not public.is_demo_workspace(workspace_id));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant select on public.workspaces, public.boards, public.feedback_posts, public.feedback_votes, public.feedback_comments, public.roadmap_items, public.roadmap_theme_links, public.changelog_entries, public.feedback_feed to anon;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.workspaces, public.workspace_members, public.workspace_invitations, public.boards, public.feedback_posts, public.feedback_votes, public.feedback_comments, public.themes, public.feedback_theme_links, public.roadmap_items, public.roadmap_theme_links, public.changelog_entries to authenticated;
grant update on public.profiles to authenticated;
grant execute on function public.is_workspace_member(uuid), public.is_workspace_editor(uuid), public.is_workspace_owner(uuid), public.is_public_workspace(uuid), public.is_public_board(uuid, uuid), public.is_demo_workspace(uuid) to anon, authenticated;
grant execute on function public.find_theme_suggestions(uuid, real, integer) to authenticated;
