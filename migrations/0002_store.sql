-- Fieldnote digital PDF store
create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order int not null default 0
);

create table if not exists products (
  id text primary key,
  title text not null,
  slug text not null unique,
  subtitle text not null default '',
  short_description text not null,
  full_description text not null default '',
  price_kobo bigint not null,
  currency text not null default 'NGN',
  category_id text not null references categories(id),
  cover_image text not null default '',
  pages int,
  benefits jsonb not null default '[]'::jsonb,
  table_of_contents jsonb not null default '[]'::jsonb,
  learnings jsonb not null default '[]'::jsonb,
  audience text not null default '',
  included jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published boolean not null default false,
  archived boolean not null default false,
  is_placeholder boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category_id);
create index if not exists products_published_idx on products (published, archived);

create table if not exists product_files (
  product_id text primary key references products(id) on delete cascade,
  filename text not null,
  mime text not null default 'application/pdf',
  data bytea not null,
  byte_size int not null,
  updated_at timestamptz not null default now()
);

create table if not exists product_covers (
  product_id text primary key references products(id) on delete cascade,
  mime text not null,
  data bytea not null,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  product_id text not null references products(id),
  amount_kobo bigint not null,
  currency text not null default 'NGN',
  payment_method text not null,
  payment_reference text not null unique,
  paystack_reference text,
  status text not null,
  transfer_note text,
  admin_notes text,
  rejection_reason text,
  email_sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_email_idx on orders (customer_email);
create index if not exists orders_product_idx on orders (product_id);
create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists transfer_proofs (
  order_id text primary key references orders(id) on delete cascade,
  filename text not null,
  mime text not null,
  data bytea not null,
  byte_size int not null,
  created_at timestamptz not null default now()
);

create table if not exists download_tokens (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  token text not null unique,
  expires_at timestamptz,
  max_downloads int not null default 20,
  download_count int not null default 0,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists download_tokens_order_idx on download_tokens (order_id);

create table if not exists download_events (
  id text primary key,
  token_id text not null references download_tokens(id) on delete cascade,
  order_id text not null,
  product_id text not null,
  downloaded_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists store_admins (
  user_id text primary key,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id text primary key,
  quote text not null,
  attribution text not null,
  is_placeholder boolean not null default true,
  sort_order int not null default 0,
  published boolean not null default true
);

create table if not exists faqs (
  id text primary key,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true
);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  event_key text not null unique,
  processed_at timestamptz not null default now()
);
