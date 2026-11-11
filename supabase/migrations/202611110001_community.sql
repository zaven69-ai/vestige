-- Phase B foundation only. Not applied to a remote project by the mobile MVP.
-- Apply with migrations in a staging Supabase project, after a moderation team exists.
begin;
create table public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 32),
  bio text not null default '' check (char_length(bio) <= 280),
  city text not null default '' check (char_length(city) <= 60),
  avatar text not null default 'compass' check (avatar in ('compass','book','temple'))
);
create table public.community_poi_catalogue (id text primary key);
alter table public.community_poi_catalogue enable row level security;
create policy catalogue_read on public.community_poi_catalogue for select using(true);
grant select on public.community_poi_catalogue to anon,authenticated;
-- Trusted service must seed canonical POI IDs before any publication can be accepted.
create table public.community_contents (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.community_profiles(id) on delete cascade,
  kind text not null check (kind in ('discovery','route')),
  title text not null check (char_length(title) between 1 and 100),
  body text not null default '' check (char_length(body) <= 2000),
  period text not null default '' check (char_length(period) <= 80),
  category text not null default '' check (char_length(category) <= 60),
  audience text not null default '' check (char_length(audience) <= 80),
  poi_ids text[] not null check (cardinality(poi_ids) between 1 and 20),
  sources text[] not null default '{}' check (cardinality(sources) <= 5),
  visibility text not null default 'draft' check (visibility in ('draft','public')),
  moderation text not null default 'pending' check (moderation in ('pending','accepted','hidden','rejected')),
  content_status text not null default 'community_published_unverified' check (content_status in ('community_published_unverified','historically_verified','live_editorial_approved')),
  version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((kind='route' and cardinality(poi_ids)>=2) or (kind='discovery' and cardinality(poi_ids)=1))
);
create index community_recent on public.community_contents(updated_at desc) where visibility='public' and moderation='accepted';
create table public.community_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.community_contents(id) on delete cascade,
  primary key(user_id,content_id)
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.community_contents(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  state text not null default 'pending' check (state in ('pending','reviewed')),
  created_at timestamptz not null default now(), unique(reporter_id,content_id)
);
create table public.community_media (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.community_contents(id) on delete cascade,
  object_path text not null unique, consent boolean not null check (consent),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp')),
  bytes integer not null check (bytes between 1 and 5242880)
);
-- Separate counters survive content deletion; only trusted trigger functions can access them.
create table public.community_rate_limits (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null, bucket timestamptz not null, counter integer not null,
  primary key(actor_id,action,bucket)
);
alter table public.community_rate_limits enable row level security;
revoke all on public.community_rate_limits from anon,authenticated;
create function public.community_rate(actor uuid, action_name text, duration_name text, maximum integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare total integer;
begin
  insert into community_rate_limits(actor_id,action,bucket,counter) values(actor,action_name,date_trunc(duration_name,now()),1)
  on conflict(actor_id,action,bucket) do update set counter=community_rate_limits.counter+1 returning counter into total;
  if total>maximum then raise exception 'Community rate limit'; end if;
end $$;
revoke all on function public.community_rate(uuid,text,text,integer) from public,anon,authenticated;
-- Whitelisted profile/content fields contain no live location or movement history.
create function public.community_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    if new.author_id <> auth.uid() then raise exception 'Author mismatch'; end if;
    if TG_OP='INSERT' then
      perform community_rate(new.author_id,'publication','day',20);
      new.created_at:=now(); new.version:=1;
    else
      if new.author_id<>old.author_id or new.id<>old.id then raise exception 'Immutable identity'; end if;
      new.created_at:=old.created_at; new.version:=old.version+1;
    end if;
    -- Every client edit invalidates previous review, including textual changes.
    new.moderation:='pending'; new.content_status:='community_published_unverified';
  end if;
  if exists(select 1 from unnest(new.poi_ids) as p(id) where not exists(select 1 from community_poi_catalogue c where c.id=p.id)) or cardinality(new.poi_ids)<>(select count(distinct id) from unnest(new.poi_ids) as p(id)) then raise exception 'Unknown or duplicate POI'; end if;
  if exists(select 1 from unnest(new.sources) as u(url) where url !~ '^https://[^[:space:]]+$' or length(url)>500) then raise exception 'Invalid source'; end if;
  new.updated_at:=now(); return new;
end $$;
create trigger community_content_guard before insert or update on public.community_contents for each row execute function public.community_guard();
create function public.community_report_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    if new.reporter_id <> auth.uid() then raise exception 'Reporter mismatch'; end if;
    perform community_rate(new.reporter_id,'report','hour',10);
    new.state:='pending'; new.created_at:=now();
  end if; return new;
end $$;
create trigger community_report_guard before insert on public.community_reports for each row execute function public.community_report_guard();
alter table public.community_profiles enable row level security;
alter table public.community_contents enable row level security;
alter table public.community_saves enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_media enable row level security;
create policy profiles_read on public.community_profiles for select using (id=auth.uid() or exists(select 1 from public.community_contents c where c.author_id=community_profiles.id and c.visibility='public' and c.moderation='accepted'));
create policy profiles_insert on public.community_profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.community_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy profiles_delete on public.community_profiles for delete to authenticated using(id=auth.uid());
create policy contents_read on public.community_contents for select using(author_id=auth.uid() or (visibility='public' and moderation='accepted'));
create policy contents_insert on public.community_contents for insert to authenticated with check(author_id=auth.uid());
create policy contents_update on public.community_contents for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy contents_delete on public.community_contents for delete to authenticated using(author_id=auth.uid());
create policy saves_private on public.community_saves for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reports_read on public.community_reports for select to authenticated using(reporter_id=auth.uid());
create policy reports_insert on public.community_reports for insert to authenticated with check(reporter_id=auth.uid() and exists(select 1 from public.community_contents c where c.id=content_id));
create policy media_read on public.community_media for select using(exists(select 1 from public.community_contents c where c.id=content_id and (c.author_id=auth.uid() or (c.visibility='public' and c.moderation='accepted'))));
-- Only the trusted upload service writes metadata. No client grant for media insert/update.
create policy media_delete on public.community_media for delete to authenticated using(author_id=auth.uid());
grant select on public.community_profiles,public.community_contents,public.community_media to anon,authenticated;
grant insert,update,delete on public.community_profiles,public.community_contents to authenticated;
grant select,insert,update,delete on public.community_saves to authenticated;
grant select,insert on public.community_reports to authenticated;
grant delete on public.community_media to authenticated;
revoke all on function public.community_guard(),public.community_report_guard() from public,anon,authenticated;
grant all on public.community_profiles,public.community_poi_catalogue,public.community_contents,public.community_saves,public.community_reports,public.community_media,public.community_rate_limits to service_role;
-- Private quarantine bucket: upload service must validate byte signatures, strip EXIF,
-- reject >3 files/content, authorize ownership and moderate before exposing signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('community-photos','community-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
-- Deliberately no client storage.objects INSERT/SELECT policy: all uploads fail closed
-- until the auth/rate-limited upload and signed-read service is implemented/tested.
commit;
