-- Migration 10: pictures for stores and products.
--
-- Images live in one public Storage bucket, `catalog-images`, under `stores/<store_id>/...`.
-- "Public" means anyone with an image's address can look at it (customers need to, and the pictures
-- are not secret). It does NOT mean anyone can upload: only a store's own owner can write into that
-- store's folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  -- 2 MB. The app shrinks photos to a few hundred KB before uploading; this is the hard ceiling.
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Which store does an object path belong to? 'stores/12/logo-ab.jpg' -> 12.
-- Anything that does not look exactly like that (another folder, a leading zero, letters, a number
-- too long to be an id, or '..' tricks) gives NULL, so no store matches and no policy allows it.
create function private.store_id_from_object_path(p_name text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^stores/[1-9][0-9]{0,17}/[^/]' and p_name !~ '\.\.'
      then split_part(p_name, '/', 2)::bigint
  end;
$$;

revoke all on function private.store_id_from_object_path(text) from public, anon;
grant execute on function private.store_id_from_object_path(text) to authenticated, service_role;

-- Who may do what with the objects in the bucket.
-- NOTE: inside these `exists (select ... from public.stores s ...)` subqueries a bare `name` would
-- mean the STORE's name, not the file's path, so the file is always written `objects.name`.
--  * INSERT / UPDATE / DELETE: only the owner of the store whose folder the object is in.
--  * SELECT: any signed-in user (the bucket is public anyway; the owner needs it to replace and
--    remove their own pictures).
-- Uploads replace nothing: the app always writes a new file name and removes the old one afterwards,
-- so no upsert (and no extra policies for it) is needed.
create policy catalog_images_select on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog-images');

create policy catalog_images_insert_own_store on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalog-images'
    and exists (
      select 1 from public.stores s
      where s.id = private.store_id_from_object_path(objects.name)
        and s.owner_id = (select auth.uid())
    )
  );

create policy catalog_images_update_own_store on storage.objects
  for update to authenticated
  using (
    bucket_id = 'catalog-images'
    and exists (
      select 1 from public.stores s
      where s.id = private.store_id_from_object_path(objects.name)
        and s.owner_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'catalog-images'
    and exists (
      select 1 from public.stores s
      where s.id = private.store_id_from_object_path(objects.name)
        and s.owner_id = (select auth.uid())
    )
  );

create policy catalog_images_delete_own_store on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'catalog-images'
    and exists (
      select 1 from public.stores s
      where s.id = private.store_id_from_object_path(objects.name)
        and s.owner_id = (select auth.uid())
    )
  );

-- The picture columns hold a path inside the bucket, and it must be in the row's OWN store folder.
-- Without this, a store could point its logo at another store's picture, or at any website, and
-- customers' phones would load it.
alter table public.stores
  add constraint stores_logo_path_check
    check (logo_url is null or (starts_with(logo_url, 'stores/' || id::text || '/') and logo_url !~ '\.\.')),
  add constraint stores_cover_path_check
    check (cover_url is null or (starts_with(cover_url, 'stores/' || id::text || '/') and cover_url !~ '\.\.'));

alter table public.products
  add constraint products_image_path_check
    check (image_url is null or (starts_with(image_url, 'stores/' || store_id::text || '/') and image_url !~ '\.\.'));
