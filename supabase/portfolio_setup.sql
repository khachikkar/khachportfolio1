create table if not exists public.portfolio_content (
  id text primary key check (id = 'main'),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

grant select on public.portfolio_content to anon, authenticated;
grant update on public.portfolio_content to authenticated;
revoke insert, delete on public.portfolio_content from anon, authenticated;

drop policy if exists portfolio_content_public_read on public.portfolio_content;
create policy portfolio_content_public_read
  on public.portfolio_content
  for select
  to anon, authenticated
  using (id = 'main');

drop policy if exists portfolio_content_owner_update on public.portfolio_content;
create policy portfolio_content_owner_update
  on public.portfolio_content
  for update
  to authenticated
  using (
    id = 'main'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  )
  with check (
    id = 'main'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists portfolio_images_admin_read on storage.objects;
create policy portfolio_images_admin_read
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'portfolio-images'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  );

drop policy if exists portfolio_images_admin_upload on storage.objects;
create policy portfolio_images_admin_upload
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-images'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  );

drop policy if exists portfolio_images_admin_replace on storage.objects;
create policy portfolio_images_admin_replace
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-images'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  )
  with check (
    bucket_id = 'portfolio-images'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  );

drop policy if exists portfolio_images_admin_delete on storage.objects;
create policy portfolio_images_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-images'
    and (select auth.jwt() ->> 'email') = 'khachikkarapetyan78@gmail.com'
  );

insert into public.portfolio_content (id, content)
values (
  'main',
  $portfolio$
  {
    "hero": {
      "image": "assets/hero-portrait.png",
      "alt": "Khachik Karapetyan shown half as a blue sketch and half as a photograph"
    },
    "projects": [
      {
        "slug": "identity-system",
        "title": "Identity system concept",
        "category": "01 / Branding",
        "description": "A modular logo, type and color system for a cultural brand.",
        "image": "assets/identity.avif",
        "alt": "Design swatches and tools arranged on a work surface",
        "focus": ["Identity direction", "Typography and color", "Guidelines and applications"]
      },
      {
        "slug": "launch-campaign",
        "title": "Launch campaign concept",
        "category": "02 / Digital campaigns",
        "description": "A social-first campaign toolkit across formats.",
        "image": "assets/campaign.avif",
        "alt": "Creative team reviewing campaign work around a table",
        "focus": ["Campaign art direction", "Social-first visual system", "Cross-format applications"]
      },
      {
        "slug": "editorial-shoot",
        "title": "Editorial shoot concept",
        "category": "03 / Art direction",
        "description": "Moodboard, styling and layout direction for print.",
        "image": "assets/editorial.avif",
        "alt": "Editorial design materials and printed layouts",
        "focus": ["Moodboard and art direction", "Styling direction", "Print layout concept"]
      },
      {
        "slug": "product-interface",
        "title": "Product interface concept",
        "category": "04 / UI/UX",
        "description": "A clean interface language for a mobile product.",
        "image": "assets/product.avif",
        "alt": "Tablet interface sketches and wireframes on a desk",
        "focus": ["Interface direction", "Wireframe concept", "Mobile product screens"]
      }
    ]
  }
  $portfolio$::jsonb
)
on conflict (id) do nothing;
