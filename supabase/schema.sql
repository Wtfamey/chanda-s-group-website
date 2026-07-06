-- ===========================================================
-- Chanda's Group Real Estate — Supabase Schema
-- ===========================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ===========================================================
-- 1. Storage buckets
insert into storage.buckets (id, name, public) values
  ('project-images', 'project-images', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow public SELECT on storage
create policy "Public can view project-images"
  on storage.objects for select
  using (bucket_id = 'project-images');
create policy "Public can view documents"
  on storage.objects for select
  using (bucket_id = 'documents');

-- Allow authenticated users to upload
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.role() = 'authenticated');
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "Authenticated users can delete their uploads"
  on storage.objects for delete
  using (auth.role() = 'authenticated');


-- 2. Listings table
create table if not exists listings (
  id text primary key,
  title text not null,
  type text not null default 'apartment',
  status text not null default 'for-sale',
  project_category text not null default 'completed',
  locality text not null,
  address text not null,
  price text not null,
  price_value numeric not null default 0,
  bedrooms integer,
  bathrooms integer,
  carpet_area text,
  total_area text,
  floors integer,
  flats integer,
  shops integer,
  possession text,
  wing text,
  description jsonb default '[]'::jsonb,
  features jsonb default '[]'::jsonb,
  amenities jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  featured boolean default false,
  created_at timestamptz default now(),
  badge text,
  floor_plan text,
  brochure text
);

-- Enable RLS
alter table listings enable row level security;

-- Everyone can read listings (public website)
create policy "Anyone can view listings"
  on listings for select
  using (true);

-- Only authenticated users can modify
create policy "Authenticated users can insert listings"
  on listings for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update listings"
  on listings for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete listings"
  on listings for delete
  using (auth.role() = 'authenticated');


-- 3. Contact messages table
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz default now(),
  read boolean default false
);

alter table contact_messages enable row level security;

-- Anyone can submit (INSERT allowed for all)
create policy "Anyone can submit contact messages"
  on contact_messages for insert
  with check (true);

-- Only authenticated admin can read
create policy "Only admin can view messages"
  on contact_messages for select
  using (auth.role() = 'authenticated');
create policy "Only admin can update messages"
  on contact_messages for update
  using (auth.role() = 'authenticated');
