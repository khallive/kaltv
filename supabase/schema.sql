create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title text not null,
  game text not null,
  viewers integer not null default 0 check (viewers >= 0),
  image text not null,
  avatar text not null,
  tag text not null,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.channels enable row level security;

create policy "Anyone can view live channels"
  on public.channels for select
  using (is_live = true);

create index if not exists channels_live_viewers_idx
  on public.channels (is_live, viewers desc);

insert into public.channels (name, title, game, viewers, image, avatar, tag, is_live)
values
  ('pixelpilot', 'late night ranked until we hit the next level ✨', 'VALORANT', 8400, 'photo-1542751371-adc38448a05e', 'photo-1535713875002-d1d0cf377fde', 'FPS', true),
  ('mira.wav', 'making a cozy little world, come hang 🌿', 'Minecraft', 2100, 'photo-1603481546238-487240415921', 'photo-1534528741775-53994a69daeb', 'Cozy', true),
  ('thebside', 'new season, new chaos | first playthrough', 'Apex Legends', 14700, 'photo-1547394765-185e1e68f34e', 'photo-1500648767791-00dcc994a43e', 'FPS', true),
  ('ninaonair', 'your favorite songs, your requests 🎧', 'Music', 945, 'photo-1516280440614-37939bbacd81', 'photo-1524504388940-b1c1722653e1', 'Music', true)
on conflict (name) do nothing;
