-- Topic waitlist + single-use launch vouchers
create table if not exists waitlist_topics (
  id text primary key,
  name text not null,
  normalized_name text not null unique,
  status text not null default 'requested',
  product_id text references products(id),
  created_at timestamptz not null default now()
);

create index if not exists waitlist_topics_status_idx on waitlist_topics (status);
create index if not exists waitlist_topics_product_idx on waitlist_topics (product_id);

create table if not exists waitlist_entries (
  id text primary key,
  topic_id text not null references waitlist_topics(id) on delete cascade,
  email text not null,
  whatsapp text,
  consent_at timestamptz not null,
  position int not null,
  created_at timestamptz not null default now(),
  unique (email, topic_id)
);

create index if not exists waitlist_entries_topic_idx on waitlist_entries (topic_id);
create index if not exists waitlist_entries_email_idx on waitlist_entries (email);

create table if not exists vouchers (
  id text primary key,
  code text not null unique,
  waitlist_entry_id text not null references waitlist_entries(id) on delete cascade,
  topic_id text not null references waitlist_topics(id) on delete cascade,
  product_id text references products(id),
  discount_kobo bigint not null default 50000,
  status text not null default 'reserved',
  activated_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_order_id text references orders(id),
  created_at timestamptz not null default now()
);

create index if not exists vouchers_code_idx on vouchers (code);
create index if not exists vouchers_topic_idx on vouchers (topic_id);
create index if not exists vouchers_status_idx on vouchers (status);

alter table orders add column if not exists voucher_id text references vouchers(id);
alter table orders add column if not exists discount_kobo bigint not null default 0;
