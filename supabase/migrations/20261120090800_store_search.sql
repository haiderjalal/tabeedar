-- Migration 9: finding stores. One function powers both "stores near me" and search.

-- Trigram indexes make `ILIKE '%milk%'` fast without a search server.
create extension if not exists pg_trgm with schema extensions;

create index stores_name_trgm_idx on public.stores using gin (name extensions.gin_trgm_ops);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------------------------
-- search_stores: the stores a customer can order from, nearest first.
--   p_latitude / p_longitude: where the customer is (their delivery address, usually)
--   p_query: optional text. A store matches if its own name matches, or it sells a product whose
--            name matches. Empty or missing means "no search": list nearby stores.
--   p_limit / p_offset: paging. The limit is kept between 1 and 50.
-- Open stores come before closed ones (a closed store is still listed, so people can see it),
-- then nearest first. `matching_products` shows up to three product names that matched, so a
-- search for "milk" can say why a store appeared.
--
-- Runs with the caller's rights, so row-level security decides which stores are visible.
-- ---------------------------------------------------------------------------------------------
create function public.search_stores(
  p_latitude double precision,
  p_longitude double precision,
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id bigint,
  name text,
  description text,
  area text,
  city text,
  logo_url text,
  is_open boolean,
  distance_m integer,
  matching_products text[]
)
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      -- The caller's text is data, not a pattern: escape LIKE's special characters so that
      -- searching for "50%" looks for those characters instead of matching everything.
      case
        when nullif(trim(p_query), '') is null then null
        else '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      end as pattern,
      least(greatest(coalesce(p_limit, 20), 1), 50) as page_size,
      greatest(coalesce(p_offset, 0), 0) as page_offset,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography as here
  )
  select
    s.id,
    s.name,
    s.description,
    s.area,
    s.city,
    s.logo_url,
    s.is_open,
    round(extensions.st_distance(s.location, params.here))::integer as distance_m,
    m.names as matching_products
  from params
  cross join public.stores s
  left join lateral (
    select array_agg(x.name order by x.name) as names
    from (
      select p.name
      from public.products p
      where params.pattern is not null
        and p.store_id = s.id
        and p.name ilike params.pattern
      order by p.name
      limit 3
    ) x
  ) m on true
  where p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and s.status = 'active'
    and (
      params.pattern is null
      or s.name ilike params.pattern
      or m.names is not null
    )
  order by s.is_open desc, extensions.st_distance(s.location, params.here), s.id
  limit (select page_size from params)
  offset (select page_offset from params);
$$;

revoke all on function public.search_stores(double precision, double precision, text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.search_stores(double precision, double precision, text, integer, integer)
  to authenticated, service_role;
