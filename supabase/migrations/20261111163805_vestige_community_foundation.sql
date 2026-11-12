-- Vestige community MVP. User-owned content; no private GPS positions stored.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (username is null or (char_length(username) between 3 and 30 and username ~ '^[A-Za-z0-9_]+$')),
  constraint profiles_display_length check (display_name is null or char_length(display_name) <= 80),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 300)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  poi_id text,
  title text not null,
  body text not null,
  image_paths text[] not null default '{}',
  visibility text not null default 'draft' check (visibility in ('draft','published')),
  verification_status text not null default 'community_published_unverified'
    check (verification_status = 'community_published_unverified'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_post_title_length check (char_length(title) between 3 and 120),
  constraint community_post_body_length check (char_length(body) between 1 and 5000),
  constraint community_post_image_count check (cardinality(image_paths) <= 5)
);

create table public.community_routes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_path text,
  city text not null default 'Lyon',
  category text,
  visibility text not null default 'draft' check (visibility in ('draft','published')),
  verification_status text not null default 'community_published_unverified'
    check (verification_status = 'community_published_unverified'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_route_title_length check (char_length(title) between 3 and 120),
  constraint community_route_description_length check (char_length(description) <= 3000)
);

create table public.community_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.community_routes(id) on delete cascade,
  position integer not null check (position between 1 and 100),
  poi_id text not null,
  note text not null default '',
  unique (route_id, position),
  constraint community_route_stop_note_length check (char_length(note) <= 1000)
);

create table public.saved_community_routes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  route_id uuid not null references public.community_routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  route_id uuid references public.community_routes(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint community_reports_one_target check ((post_id is not null) <> (route_id is not null)),
  constraint community_reports_reason_length check (char_length(reason) between 3 and 1000)
);

create index community_posts_author_idx on public.community_posts(author_id, created_at desc);
create index community_posts_public_idx on public.community_posts(created_at desc) where visibility='published';
create index community_routes_author_idx on public.community_routes(author_id, created_at desc);
create index community_routes_public_idx on public.community_routes(created_at desc) where visibility='published';
create index community_route_stops_route_idx on public.community_route_stops(route_id, position);
create index saved_community_routes_route_idx on public.saved_community_routes(route_id);
create index community_reports_created_idx on public.community_reports(created_at desc);

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_posts before update on public.community_posts for each row execute function public.touch_updated_at();
create trigger touch_routes before update on public.community_routes for each row execute function public.touch_updated_at();

create function public.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_routes enable row level security;
alter table public.community_route_stops enable row level security;
alter table public.saved_community_routes enable row level security;
alter table public.community_reports enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy posts_read on public.community_posts for select to authenticated
  using (visibility = 'published' or author_id = (select auth.uid()));
create policy posts_insert_own on public.community_posts for insert to authenticated
  with check (author_id = (select auth.uid()) and verification_status = 'community_published_unverified');
create policy posts_update_own on public.community_posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and verification_status = 'community_published_unverified');
create policy posts_delete_own on public.community_posts for delete to authenticated
  using (author_id = (select auth.uid()));

create policy routes_read on public.community_routes for select to authenticated
  using (visibility = 'published' or author_id = (select auth.uid()));
create policy routes_insert_own on public.community_routes for insert to authenticated
  with check (author_id = (select auth.uid()) and verification_status = 'community_published_unverified');
create policy routes_update_own on public.community_routes for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and verification_status = 'community_published_unverified');
create policy routes_delete_own on public.community_routes for delete to authenticated
  using (author_id = (select auth.uid()));

create policy stops_read on public.community_route_stops for select to authenticated
  using (exists (select 1 from public.community_routes r where r.id = route_id and (r.visibility = 'published' or r.author_id = (select auth.uid()))));
create policy stops_insert_owner on public.community_route_stops for insert to authenticated
  with check (exists (select 1 from public.community_routes r where r.id = route_id and r.author_id = (select auth.uid())));
create policy stops_update_owner on public.community_route_stops for update to authenticated
  using (exists (select 1 from public.community_routes r where r.id = route_id and r.author_id = (select auth.uid())))
  with check (exists (select 1 from public.community_routes r where r.id = route_id and r.author_id = (select auth.uid())));
create policy stops_delete_owner on public.community_route_stops for delete to authenticated
  using (exists (select 1 from public.community_routes r where r.id = route_id and r.author_id = (select auth.uid())));

create policy saved_read_own on public.saved_community_routes for select to authenticated using (user_id = (select auth.uid()));
create policy saved_insert_own on public.saved_community_routes for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.community_routes r where r.id = route_id and (r.visibility = 'published' or r.author_id = (select auth.uid()))));
create policy saved_delete_own on public.saved_community_routes for delete to authenticated using (user_id = (select auth.uid()));

create policy reports_read_own on public.community_reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy reports_insert_own on public.community_reports for insert to authenticated with check (reporter_id = (select auth.uid()));

-- Published user contributions are never automatically editorially verified or approved for Vestige Live.
