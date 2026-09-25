-- Vérifications exécutées après application du schéma (voir db/README.md).
\set ON_ERROR_STOP on
begin;

-- Données minimales
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'createur@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'acheteur@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'autre@example.com');
insert into profiles (id, display_name, account_type, status) values
  ('00000000-0000-0000-0000-00000000000a', 'Maëlle', 'creator', 'active'),
  ('00000000-0000-0000-0000-00000000000b', 'Camille', 'buyer', 'active'),
  ('00000000-0000-0000-0000-00000000000c', 'Alex', 'buyer', 'active');
insert into categories (slug, label) values ('vetements', 'Vêtements');
insert into creators (id, user_id, slug, brand_name, real_name, stage, city, verification)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'atelier-nova', 'Atelier Nova', 'Maëlle Duret', 'student', 'Paris', 'verified');
insert into products (id, slug, creator_id, title, category_slug, price_cents, edition, status) values
  ('20000000-0000-0000-0000-000000000001', 'veste', '10000000-0000-0000-0000-000000000001', 'Veste Contremaître', 'vetements', 24000, 'unique', 'published'),
  ('20000000-0000-0000-0000-000000000002', 'brouillon', '10000000-0000-0000-0000-000000000001', 'Pièce en cours', 'vetements', 9000, 'unique', 'draft');
insert into product_variants (id, product_id, sku, size, stock) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'VESTE-M', 'M', 1);
insert into orders (id, number, buyer_id, items_cents, total_cents, shipping_address, idempotency_key)
values ('40000000-0000-0000-0000-000000000001', 'SIGN-1048', '00000000-0000-0000-0000-00000000000b', 24000, 24600, '{}', 'k1');
insert into seller_orders (id, order_id, creator_id, items_cents, shipping_cents)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 24000, 600);
insert into seller_order_fees (seller_order_id, commission_cents, commission_rate, plan)
values ('50000000-0000-0000-0000-000000000001', 1920, 0.08, 'launch');
insert into favorites (user_id, product_id) values ('00000000-0000-0000-0000-00000000000c', '20000000-0000-0000-0000-000000000001');
insert into admin_members (user_id, role, mfa_enrolled) values ('00000000-0000-0000-0000-00000000000c', 'super_admin', true);
insert into admin_logs (admin_id, action, target_type, target_id, before, after, reason)
values ('00000000-0000-0000-0000-00000000000c', 'account.suspend', 'user', 'x', '{"status":"active"}', '{"status":"suspended"}', 'Test');

-- 1. Recherche plein texte sans accents
do $$ begin
  assert (select count(*) from products where search @@ plainto_tsquery('simple', unaccent('contremaitre'))) = 1, 'recherche plein texte';
end $$;

-- 2. Le dernier exemplaire ne peut être réservé qu'une fois
do $$
declare ok boolean := false;
begin
  perform reserve_variant('30000000-0000-0000-0000-000000000001', gen_random_uuid(), 1);
  begin
    perform reserve_variant('30000000-0000-0000-0000-000000000001', gen_random_uuid(), 1);
  exception when sqlstate 'P0001' then ok := true;
  end;
  assert ok, 'la seconde réservation du dernier exemplaire doit échouer';
  assert variant_available('30000000-0000-0000-0000-000000000001') = 0, 'disponible = 0';
end $$;

-- 3. Une réservation expirée libère le stock
update inventory_reservations set expires_at = now() - interval '1 minute';
do $$ begin
  assert variant_available('30000000-0000-0000-0000-000000000001') = 1, 'réservation expirée libérée';
end $$;

-- 4. Journal d'audit en ajout seul
do $$
declare ok boolean := false;
begin
  begin
    update admin_logs set reason = 'modifié';
  exception when sqlstate '42501' then ok := true;
  end;
  assert ok, 'le journal d''audit ne doit pas être modifiable';
end $$;

-- 5. Row Level Security, vue d'un acheteur connecté
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
declare ok boolean := false;
begin
  assert (select count(*) from admin_members) = 0, 'un acheteur ne voit pas les administrateurs';
  assert (select count(*) from admin_logs) = 0, 'un acheteur ne voit pas le journal d''audit';
  assert (select count(*) from favorites) = 0, 'un acheteur ne voit pas les favoris des autres';
  assert (select count(*) from products) = 1, 'un acheteur ne voit que les produits publiés';
  assert (select count(*) from profiles) = 1, 'un acheteur ne voit que son profil';
  assert (select count(*) from seller_orders) = 1, 'un acheteur voit sa sous-commande';
  assert (select count(*) from seller_order_fees) = 0, 'un acheteur ne voit jamais la commission';
  -- Tentative d'auto-promotion : aucune ligne visible, donc aucune insertion possible
  begin
    insert into admin_members (user_id, role) values ('00000000-0000-0000-0000-00000000000b', 'super_admin');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'un acheteur ne peut pas se déclarer administrateur';
  ok := false;
  begin
    update profiles set status = 'active', account_type = 'creator' where id = auth.uid();
  exception when sqlstate '42501' then ok := true;
  end;
  assert ok, 'un utilisateur ne change pas son type de compte';
end $$;

-- 6. Le créateur voit son brouillon
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from products) = 2, 'le créateur voit ses brouillons';
  assert (select commission_cents from seller_order_fees) = 1920, 'le créateur voit les frais de ses ventes';
end $$;

-- 7. Un visiteur anonyme
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from products) = 1, 'anonyme : produits publiés uniquement';
  assert (select count(*) from profiles) = 0, 'anonyme : aucun profil';
end $$;

rollback;
\echo 'Toutes les vérifications du schéma sont passées.'
