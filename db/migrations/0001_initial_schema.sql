-- =====================================================================
-- Signé — schéma initial (PostgreSQL 15+ / Supabase)
--
-- Principes :
--  * Row Level Security activée sur TOUTES les tables.
--  * Le navigateur (rôles anon / authenticated) ne lit que le contenu public
--    et ses propres données. Toute opération sensible (administration,
--    remboursement, suspension, rôles, finance) passe par le serveur avec
--    la clé de service, après contrôle des permissions (src/lib/auth).
--  * Aucun rôle d'administration dans `profiles` : table `admin_members`
--    séparée, sans aucune policy client.
--  * Montants en centimes (integer), devise explicite.
--  * Journal d'audit en ajout seul : UPDATE et DELETE interdits.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type account_type as enum ('buyer', 'creator', 'business');
create type account_status as enum ('pending_verification', 'active', 'restricted', 'suspended', 'banned');
create type admin_role as enum ('super_admin', 'moderator', 'support', 'finance', 'analyst');
create type school_kind as enum ('mode', 'design', 'arts_appliques', 'beaux_arts');
create type creator_stage as enum ('student', 'graduate', 'independent_brand');
create type verification_status as enum ('pending', 'verified', 'changes_requested', 'rejected');
create type product_status as enum ('draft', 'pending_review', 'changes_requested', 'published', 'hidden', 'rejected');
create type edition_kind as enum ('unique', 'limited', 'made_to_order', 'ongoing');
create type media_kind as enum ('main', 'detail', 'worn', 'alternate', 'atelier', 'portrait', 'cover');
create type order_status as enum ('pending_payment', 'paid', 'partially_fulfilled', 'fulfilled', 'cancelled', 'refunded', 'partially_refunded');
create type seller_order_status as enum ('awaiting_payment', 'to_prepare', 'in_production', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded');
create type payment_status as enum ('requires_action', 'processing', 'succeeded', 'failed', 'cancelled');
create type refund_status as enum ('requested', 'approved', 'processing', 'succeeded', 'failed', 'rejected');
create type shipment_status as enum ('label_created', 'in_transit', 'delivered', 'delayed', 'lost', 'returned_to_sender', 'wrong_address', 'not_collected');
create type return_status as enum ('requested', 'under_review', 'approved', 'rejected', 'return_shipped', 'received', 'refunded', 'closed');
create type ticket_status as enum ('new', 'open', 'in_progress', 'waiting_customer', 'waiting_seller', 'escalated', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type ticket_category as enum ('payment', 'order', 'delivery', 'return', 'refund', 'product', 'account', 'security', 'review', 'other');
create type dispute_reason as enum ('not_received', 'damaged', 'not_as_described', 'seller_unresponsive', 'buyer_unresponsive', 'refund_issue', 'other');
create type dispute_status as enum ('open', 'awaiting_buyer', 'awaiting_seller', 'under_review', 'decided', 'closed');
create type report_target as enum ('user', 'creator', 'business', 'product', 'review', 'message');
create type report_status as enum ('open', 'under_review', 'actioned', 'dismissed');
create type sanction_kind as enum ('warning', 'product_hidden', 'restriction', 'temporary_suspension', 'ban');
create type appeal_status as enum ('pending', 'upheld', 'overturned');
create type review_status as enum ('visible', 'hidden');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');
create type transaction_kind as enum ('charge', 'commission', 'processing_fee', 'payout', 'refund', 'subscription', 'adjustment');

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Comptes
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  account_type account_type not null default 'buyer',
  status account_status not null default 'pending_verification',
  city text,
  avatar_path text,
  acquisition_source text,           -- instagram, tiktok, ecole:<slug>, createur:<slug>, evenement, seo…
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz,
  anonymized_at timestamptz          -- RGPD : compte anonymisé, données personnelles effacées
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- Un utilisateur ne peut modifier que ses champs éditables, jamais son statut ni son type de compte.
create or replace function profiles_guard_columns() returns trigger language plpgsql as $$
begin
  if current_setting('request.jwt.claim.role', true) in ('anon', 'authenticated')
     or current_user in ('anon', 'authenticated') then
    if new.status is distinct from old.status
       or new.account_type is distinct from old.account_type
       or new.anonymized_at is distinct from old.anonymized_at
       or new.acquisition_source is distinct from old.acquisition_source then
      raise exception 'Modification non autorisée' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function profiles_guard_columns();

-- Rôles d'administration : aucune policy client, écrit uniquement par le serveur.
create table admin_members (
  user_id uuid primary key references profiles (id) on delete cascade,
  role admin_role not null,
  mfa_enrolled boolean not null default false,
  active boolean not null default true,
  granted_by uuid references profiles (id),
  granted_at timestamptz not null default now()
);

-- Historique de connexion admin (appareil, IP tronquée) et sessions révocables.
create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references admin_members (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  mfa_verified_at timestamptz,
  ip_prefix inet,                    -- /24 en IPv4, /48 en IPv6 : moindre collecte
  user_agent text,
  revoked_at timestamptz,
  revoked_by uuid references profiles (id)
);
create index admin_sessions_user on admin_sessions (user_id, created_at desc);

create table auth_events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles (id) on delete set null,
  kind text not null check (kind in ('login', 'login_failed', 'logout', 'password_reset', 'email_verified', 'mfa_challenge', 'mfa_failed', 'session_revoked')),
  ip_prefix inet,
  created_at timestamptz not null default now()
);
create index auth_events_user on auth_events (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Écoles, créateurs, entreprises
-- ---------------------------------------------------------------------
create table schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  city text not null,
  kind school_kind not null,
  description text not null default '',
  cover_path text,
  partner boolean not null default false,
  created_at timestamptz not null default now()
);

create table creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  brand_name text not null,
  real_name text not null,
  pseudonym text,
  tagline text not null default '',
  bio text not null default '',
  story text not null default '',
  motivation text not null default '',
  school_id uuid references schools (id) on delete set null,
  graduation_year smallint,
  stage creator_stage not null,
  city text not null,
  specialty text not null default '',
  universes text[] not null default '{}',
  socials jsonb not null default '{}',
  show_socials boolean not null default false,
  portrait_path text,
  cover_path text,
  atelier_path text,
  verification verification_status not null default 'pending',
  selected_at timestamptz,
  launch_partner boolean not null default false,
  follower_count integer not null default 0,
  payout_account_id text,            -- identifiant du compte connecté chez le prestataire de paiement
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger creators_updated before update on creators for each row execute function set_updated_at();
create index creators_school on creators (school_id);
create index creators_city on creators (city);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references profiles (id) on delete cascade,
  slug text not null unique,
  legal_name text not null,
  display_name text not null,
  kind text not null check (kind in ('friperie', 'vintage', 'concept_store', 'boutique', 'revendeur')),
  siret text,
  city text not null,
  verification verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
create table categories (
  slug text primary key,
  label text not null,
  parent_slug text references categories (slug),
  position smallint not null default 0
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators (id) on delete cascade,
  slug text not null,
  title text not null,
  season text not null default '',
  description text not null default '',
  cover_path text,
  published_at timestamptz,
  unique (creator_id, slug)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  creator_id uuid references creators (id) on delete cascade,
  business_id uuid references businesses (id) on delete cascade,
  collection_id uuid references collections (id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '',
  story text,
  category_slug text not null references categories (slug),
  subcategory_slug text references categories (slug),
  price_cents integer not null check (price_cents > 0),
  currency char(3) not null default 'EUR',
  materials text[] not null default '{}',
  colors jsonb not null default '[]',
  sizes text[] not null default '{}',
  edition edition_kind not null,
  edition_size integer check (edition_size is null or edition_size > 0),
  lead_time_days smallint check (lead_time_days is null or lead_time_days between 1 and 180),
  status product_status not null default 'draft',
  popularity integer not null default 0,
  favorite_count integer not null default 0,
  search tsvector,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un produit appartient à un créateur OU à une entreprise.
  check ((creator_id is not null) <> (business_id is not null)),
  check (edition <> 'limited' or edition_size is not null),
  check (edition <> 'made_to_order' or lead_time_days is not null)
);
create trigger products_updated before update on products for each row execute function set_updated_at();
create index products_public on products (status, created_at desc);
create index products_creator on products (creator_id);
create index products_category on products (category_slug, subcategory_slug);
create index products_price on products (price_cents);
create index products_search on products using gin (search);

create or replace function products_search_vector() returns trigger language plpgsql as $$
begin
  new.search :=
    setweight(to_tsvector('simple', unaccent(coalesce(new.title, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(array_to_string(new.materials, ' '))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(new.description, ''))), 'C');
  return new;
end $$;
create trigger products_search_update before insert or update of title, materials, description on products
  for each row execute function products_search_vector();

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  storage_path text not null,        -- chemin dans le bucket, servi via CDN
  alt text not null default '',
  kind media_kind not null default 'alternate',
  position smallint not null default 0,
  width integer,
  height integer,
  moderation verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (product_id, position)
);
-- Une seule photo principale par produit.
create unique index product_media_one_main on product_media (product_id) where kind = 'main';

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  price_cents integer check (price_cents is null or price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, size, color)
);

-- Réservations temporaires pendant le paiement (anti double vente du dernier exemplaire).
create table inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  checkout_id uuid not null,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  released_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);
create index inventory_reservations_active on inventory_reservations (variant_id) where released_at is null and converted_at is null;

-- Stock disponible = stock - réservations actives non expirées.
create or replace function variant_available(p_variant uuid) returns integer language sql stable as $$
  select v.stock - coalesce((
    select sum(r.quantity) from inventory_reservations r
    where r.variant_id = v.id and r.released_at is null and r.converted_at is null and r.expires_at > now()
  ), 0)::integer
  from product_variants v where v.id = p_variant
$$;

-- Réserve atomiquement : verrouille la variante, vérifie la disponibilité, insère la réservation.
-- Deux paiements simultanés sur le dernier exemplaire : le second échoue.
create or replace function reserve_variant(p_variant uuid, p_checkout uuid, p_quantity integer, p_ttl interval default interval '15 minutes')
returns uuid language plpgsql as $$
declare
  v_id uuid;
begin
  perform 1 from product_variants where id = p_variant for update;
  if not found then
    raise exception 'Variante inconnue' using errcode = 'P0002';
  end if;
  if variant_available(p_variant) < p_quantity then
    raise exception 'Stock insuffisant' using errcode = 'P0001';
  end if;
  insert into inventory_reservations (variant_id, checkout_id, quantity, expires_at)
  values (p_variant, p_checkout, p_quantity, now() + p_ttl)
  returning id into v_id;
  return v_id;
end $$;

-- Paiement confirmé : décrémente le stock et consomme la réservation.
create or replace function convert_reservation(p_reservation uuid) returns void language plpgsql as $$
declare
  r inventory_reservations;
begin
  select * into r from inventory_reservations where id = p_reservation for update;
  if r.id is null or r.released_at is not null or r.converted_at is not null then
    raise exception 'Réservation invalide' using errcode = 'P0001';
  end if;
  update product_variants set stock = stock - r.quantity where id = r.variant_id;
  update inventory_reservations set converted_at = now() where id = r.id;
end $$;

-- ---------------------------------------------------------------------
-- Commandes (multi-vendeurs) et paiements
-- ---------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,       -- SIGN-1048
  buyer_id uuid references profiles (id) on delete set null,
  status order_status not null default 'pending_payment',
  items_cents integer not null check (items_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'EUR',
  shipping_address jsonb not null,
  idempotency_key text not null unique, -- empêche la double création sur rejeu du checkout
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated before update on orders for each row execute function set_updated_at();
create index orders_buyer on orders (buyer_id, created_at desc);

-- Une sous-commande par créateur : préparée, expédiée et suivie séparément.
create table seller_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  creator_id uuid references creators (id),
  business_id uuid references businesses (id),
  status seller_order_status not null default 'awaiting_payment',
  items_cents integer not null,
  shipping_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((creator_id is not null) <> (business_id is not null))
);
create trigger seller_orders_updated before update on seller_orders for each row execute function set_updated_at();
create index seller_orders_creator on seller_orders (creator_id, created_at desc);
create index seller_orders_order on seller_orders (order_id);

-- Frais internes d'une sous-commande. Table séparée : la RLS filtre des lignes,
-- pas des colonnes. L'acheteur ne peut donc jamais lire la commission.
create table seller_order_fees (
  seller_order_id uuid primary key references seller_orders (id) on delete cascade,
  commission_cents integer not null check (commission_cents >= 0),
  commission_rate numeric(5, 4) not null,
  processing_cents integer not null default 0 check (processing_cents >= 0),
  plan text not null
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references seller_orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references product_variants (id) on delete set null,
  reservation_id uuid references inventory_reservations (id),
  title_snapshot text not null,      -- copie figée au moment de l'achat
  variant_snapshot jsonb not null default '{}',
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity > 0)
);

create table order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders (id) on delete cascade,
  seller_order_id uuid references seller_orders (id) on delete cascade,
  kind text not null,
  actor_id uuid references profiles (id),
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index order_events_order on order_events (order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id),
  provider text not null,            -- stripe, simulated…
  provider_ref text not null,        -- PaymentIntent, etc.
  status payment_status not null,
  amount_cents integer not null,
  currency char(3) not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_ref)
);
create trigger payments_updated before update on payments for each row execute function set_updated_at();

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id),
  seller_order_id uuid references seller_orders (id),
  amount_cents integer not null check (amount_cents > 0),
  reason text not null,
  status refund_status not null default 'requested',
  provider_ref text,
  requested_by uuid references profiles (id),
  approved_by uuid references profiles (id),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger refunds_updated before update on refunds for each row execute function set_updated_at();

create table payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators (id),
  business_id uuid references businesses (id),
  amount_cents integer not null check (amount_cents > 0),
  status text not null check (status in ('scheduled', 'in_transit', 'paid', 'failed')),
  provider_ref text,
  scheduled_for date not null,
  created_at timestamptz not null default now()
);

-- Événements reçus des prestataires : traitement idempotent des webhooks.
create table webhook_events (
  provider text not null,
  event_id text not null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  primary key (provider, event_id)
);

create table transactions (
  id bigint generated always as identity primary key,
  kind transaction_kind not null,
  amount_cents integer not null,     -- signé : négatif pour une sortie
  currency char(3) not null default 'EUR',
  order_id uuid references orders (id),
  seller_order_id uuid references seller_orders (id),
  creator_id uuid references creators (id),
  business_id uuid references businesses (id),
  payment_id uuid references payments (id),
  refund_id uuid references refunds (id),
  payout_id uuid references payouts (id),
  created_at timestamptz not null default now()
);
create index transactions_created on transactions (created_at desc);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references creators (id),
  business_id uuid references businesses (id),
  plan text not null,
  status subscription_status not null,
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Livraison et retours
-- ---------------------------------------------------------------------
create table shipments (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references seller_orders (id) on delete cascade,
  carrier text,                      -- renseigné par le créateur, puis intégration transporteur
  tracking_number text,
  tracking_url text,
  status shipment_status not null default 'label_created',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shipments_updated before update on shipments for each row execute function set_updated_at();

create table returns (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references seller_orders (id),
  requested_by uuid not null references profiles (id),
  reason dispute_reason not null,
  details text not null default '',
  status return_status not null default 'requested',
  return_tracking text,
  refund_id uuid references refunds (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger returns_updated before update on returns for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Communauté
-- ---------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  creator_id uuid not null references creators (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  order_item_id uuid references order_items (id),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  verified_purchase boolean not null default false,
  status review_status not null default 'visible',
  created_at timestamptz not null default now(),
  unique (author_id, product_id)
);
create index reviews_product on reviews (product_id) where status = 'visible';

create table favorites (
  user_id uuid not null references profiles (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table creator_follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  creator_id uuid not null references creators (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id)
);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  href text,                         -- lien direct vers le dossier concerné
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Support, litiges, modération
-- ---------------------------------------------------------------------
create sequence ticket_number_seq start 300;

create table tickets (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('TICKET-' || nextval('ticket_number_seq')),
  user_id uuid references profiles (id) on delete set null,
  category ticket_category not null,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'new',
  subject text not null,
  order_id uuid references orders (id),
  creator_id uuid references creators (id),
  assigned_to uuid references admin_members (user_id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tickets_updated before update on tickets for each row execute function set_updated_at();
create index tickets_queue on tickets (status, priority, last_message_at desc);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid references profiles (id),
  body text not null,
  attachments jsonb not null default '[]',
  internal boolean not null default false, -- note interne : jamais visible par le client
  created_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references seller_orders (id),
  opened_by uuid not null references profiles (id),
  reason dispute_reason not null,
  status dispute_status not null default 'open',
  decision text,
  decision_reason text,
  decided_by uuid references admin_members (user_id),
  decided_at timestamptz,
  refund_id uuid references refunds (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'decided' or (decision is not null and decision_reason is not null and decided_by is not null))
);
create trigger disputes_updated before update on disputes for each row execute function set_updated_at();

create table dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references disputes (id) on delete cascade,
  submitted_by uuid not null references profiles (id),
  kind text not null check (kind in ('photo', 'message', 'tracking', 'document')),
  storage_path text,
  body text,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_type report_target not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  handled_by uuid references admin_members (user_id),
  created_at timestamptz not null default now()
);
create index reports_open on reports (target_type, target_id) where status in ('open', 'under_review');

create table moderation_actions (
  id bigint generated always as identity primary key,
  admin_id uuid not null references admin_members (user_id),
  target_type report_target not null,
  target_id uuid not null,
  action text not null check (action in ('approve', 'reject', 'request_changes', 'hide', 'restore', 'suspend', 'sanction')),
  reason text not null,
  report_id uuid references reports (id),
  created_at timestamptz not null default now()
);

create table sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  kind sanction_kind not null,
  reason text not null,
  evidence jsonb not null default '[]',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,               -- null = permanente
  issued_by uuid not null references admin_members (user_id),
  lifted_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind <> 'temporary_suspension' or ends_at is not null)
);

create table sanction_appeals (
  id uuid primary key default gen_random_uuid(),
  sanction_id uuid not null references sanctions (id) on delete cascade,
  statement text not null,
  status appeal_status not null default 'pending',
  reviewed_by uuid references admin_members (user_id),
  review_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------
-- Journal d'audit administrateur (ajout seul)
-- ---------------------------------------------------------------------
create table admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references admin_members (user_id),
  action text not null,              -- ex. account.suspend, refund.issue, role.grant, user.view_contact
  target_type text not null,
  target_id text not null,
  before jsonb,
  after jsonb,
  reason text not null check (char_length(reason) >= 3),
  created_at timestamptz not null default now()
);
create index admin_logs_target on admin_logs (target_type, target_id, created_at desc);
create index admin_logs_admin on admin_logs (admin_id, created_at desc);

create or replace function admin_logs_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'Le journal d''audit est en ajout seul' using errcode = '42501';
end $$;
create trigger admin_logs_no_update before update or delete on admin_logs for each row execute function admin_logs_append_only();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','admin_members','admin_sessions','auth_events','schools','creators','businesses','categories',
    'collections','products','product_media','product_variants','inventory_reservations','orders','seller_orders','seller_order_fees',
    'order_items','order_events','payments','refunds','payouts','webhook_events','transactions','subscriptions',
    'shipments','returns','reviews','favorites','creator_follows','notifications','tickets','ticket_messages',
    'disputes','dispute_evidence','reports','moderation_actions','sanctions','sanction_appeals','admin_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- Contenu public
create policy "écoles publiques" on schools for select using (true);
create policy "catégories publiques" on categories for select using (true);
create policy "créateurs vérifiés publics" on creators for select using (verification = 'verified' or user_id = auth.uid());
create policy "entreprises vérifiées publiques" on businesses for select using (verification = 'verified' or owner_id = auth.uid());
create policy "collections publiques" on collections for select
  using (exists (select 1 from creators c where c.id = creator_id and (c.verification = 'verified' or c.user_id = auth.uid())));
create policy "produits publiés publics" on products for select
  using (
    (status = 'published' and exists (select 1 from creators c where c.id = creator_id and c.verification = 'verified'))
    or (status = 'published' and exists (select 1 from businesses b where b.id = business_id and b.verification = 'verified'))
    or exists (select 1 from creators c where c.id = creator_id and c.user_id = auth.uid())
    or exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );
create policy "médias des produits visibles" on product_media for select
  using (exists (select 1 from products p where p.id = product_id));  -- hérite de la policy produits
create policy "variantes des produits visibles" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id));
create policy "avis visibles" on reviews for select using (status = 'visible' or author_id = auth.uid());

-- Données personnelles : chacun les siennes
create policy "mon profil" on profiles for select using (id = auth.uid());
create policy "modifier mon profil" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "mes favoris" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mes abonnements créateurs" on creator_follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());
create policy "mes notifications" on notifications for select using (user_id = auth.uid());
create policy "lire mes notifications" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mes commandes" on orders for select using (buyer_id = auth.uid());
create policy "mes sous-commandes" on seller_orders for select
  using (exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
      or exists (select 1 from creators c where c.id = creator_id and c.user_id = auth.uid()));
create policy "frais de mes ventes" on seller_order_fees for select
  using (exists (select 1 from seller_orders so join creators c on c.id = so.creator_id
                 where so.id = seller_order_id and c.user_id = auth.uid()));
create policy "mes articles commandés" on order_items for select
  using (exists (select 1 from seller_orders so join orders o on o.id = so.order_id
                 left join creators c on c.id = so.creator_id
                 where so.id = seller_order_id and (o.buyer_id = auth.uid() or c.user_id = auth.uid())));
create policy "mes expéditions" on shipments for select
  using (exists (select 1 from seller_orders so join orders o on o.id = so.order_id
                 left join creators c on c.id = so.creator_id
                 where so.id = seller_order_id and (o.buyer_id = auth.uid() or c.user_id = auth.uid())));
create policy "mes tickets" on tickets for select using (user_id = auth.uid());
create policy "messages publics de mes tickets" on ticket_messages for select
  using (internal = false and exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "mes sanctions" on sanctions for select using (user_id = auth.uid());
create policy "signaler" on reports for insert with check (reporter_id = auth.uid());

-- Aucune policy client sur : admin_members, admin_sessions, auth_events, inventory_reservations,
-- order_events, payments, refunds, payouts, webhook_events, transactions, subscriptions, returns,
-- disputes, dispute_evidence, moderation_actions, sanction_appeals, admin_logs.
-- Ces tables ne sont accessibles que par le serveur (clé de service) après contrôle des permissions.
-- Les écritures (créer un produit, commander, ouvrir un litige…) passent par des Server Actions.
