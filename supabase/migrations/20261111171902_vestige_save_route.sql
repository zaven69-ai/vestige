begin;

-- Route writes and stop writes lock the same parent row. Published routes may
-- be edited or deleted by their author, but their itinerary stays immutable.
create function public.vestige_guard_route_stop()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_visibility text;
  parent_id uuid;
begin
  if tg_op <> 'DELETE' and new.poi_id !~ '^[A-Za-z0-9_-]{1,128}$' then
    raise exception 'Invalid POI identifier' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and new.route_id is distinct from old.route_id then
    raise exception 'A stop cannot be moved to another route' using errcode = '23514';
  end if;

  parent_id := case when tg_op = 'DELETE' then old.route_id else new.route_id end;
  select visibility into parent_visibility
  from public.community_routes where id = parent_id for update;

  if parent_visibility = 'published' then
    raise exception 'Published route stops cannot be changed' using errcode = '23514';
  end if;

  -- When a route is deleted, its cascading deletes see no parent row.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger vestige_guard_route_stop
before insert or update or delete on public.community_route_stops
for each row execute function public.vestige_guard_route_stop();

create function public.vestige_guard_route_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stop_count integer;
  distinct_count integer;
  first_stop integer;
  last_stop integer;
begin
  if tg_op = 'INSERT' then
    if new.visibility = 'published' then
      raise exception 'Create a draft before publishing a route' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.visibility = 'published' and new.visibility <> 'published' then
    raise exception 'A published route cannot return to draft' using errcode = '23514';
  end if;

  if new.visibility = 'published' and old.visibility = 'draft' then
    select count(*), count(distinct poi_id), min(position), max(position)
    into stop_count, distinct_count, first_stop, last_stop
    from public.community_route_stops where route_id = old.id;
    if stop_count not between 2 and 20 or distinct_count <> stop_count
       or first_stop <> 1 or last_stop <> stop_count then
      raise exception 'Publishing requires 2 to 20 distinct, ordered stops' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger vestige_guard_route_publication
before insert or update of visibility on public.community_routes
for each row execute function public.vestige_guard_route_publication();

create function public.vestige_save_route(
  p_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_poi_ids text[],
  p_visibility text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  saved_route_id uuid;
  previous_stops text[];
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_visibility is null or p_visibility not in ('draft', 'published')
     or p_title is null or char_length(btrim(p_title)) not between 3 and 120
     or p_description is null or char_length(p_description) > 3000
     or char_length(coalesce(p_category, '')) > 60
     or p_poi_ids is null or array_ndims(p_poi_ids) is distinct from 1
     or cardinality(p_poi_ids) not between 2 and 20
     or exists (select 1 from unnest(p_poi_ids) as poi(id)
                where poi.id is null or poi.id !~ '^[A-Za-z0-9_-]{1,128}$')
     or (select count(distinct poi.id) from unnest(p_poi_ids) as poi(id)) <> cardinality(p_poi_ids) then
    raise exception 'Invalid route fields or stops' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.community_routes (author_id, title, description, category)
    values (uid, btrim(p_title), p_description, p_category)
    returning id into saved_route_id;
  else
    select r.id into saved_route_id
    from public.community_routes r
    where r.id = p_id and r.author_id = uid
    for update;
    if not found then
      raise exception 'Route unavailable' using errcode = '42501';
    end if;

    select array_agg(s.poi_id order by s.position) into previous_stops
    from public.community_route_stops s where s.route_id = p_id;
  end if;

  if previous_stops is distinct from p_poi_ids then
    delete from public.community_route_stops s where s.route_id = saved_route_id;
    insert into public.community_route_stops (route_id, position, poi_id)
    select saved_route_id, poi.position::integer, poi.id
    from unnest(p_poi_ids) with ordinality as poi(id, position);
  end if;

  update public.community_routes r
  set title = btrim(p_title), description = p_description,
      category = p_category, visibility = p_visibility
  where r.id = saved_route_id;
  return saved_route_id;
end;
$$;

revoke execute on function public.vestige_guard_route_stop() from public, anon, authenticated;
revoke execute on function public.vestige_guard_route_publication() from public, anon, authenticated;
revoke execute on function public.vestige_save_route(uuid, text, text, text, text[], text) from public, anon;
grant execute on function public.vestige_save_route(uuid, text, text, text, text[], text) to authenticated;

-- Match the client operations explicitly, including on new Supabase projects
-- whose default privileges do not expose new tables through the Data API.
revoke all on public.profiles, public.community_posts, public.community_routes,
  public.community_route_stops, public.saved_community_routes, public.community_reports
  from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.community_posts, public.community_routes,
  public.community_route_stops to authenticated;
grant select, insert, delete on public.saved_community_routes to authenticated;
grant select, insert on public.community_reports to authenticated;

commit;
