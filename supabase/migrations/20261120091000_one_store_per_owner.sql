-- Migration 11: one store per store account.
--
-- Decided by the owner: a store account runs exactly one store. The app builds its screens on that
-- (the store area opens straight into "my store"), and the database enforces it so a modified app
-- cannot create a second one. If multi-store accounts are ever wanted, this constraint is the only
-- thing to relax; every table already points at `store_id`, not at the owner.

-- The unique constraint creates its own index on owner_id, which makes the plain one redundant.
drop index public.stores_owner_id_idx;

alter table public.stores
  add constraint stores_owner_id_key unique (owner_id);
