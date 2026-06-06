-- ============================================================================
-- ColorVote — Supabase Database Schema (Extended with Ticker News)
-- ============================================================================

-- 1. Create colors table
create table public.colors (
  id uuid primary key default gen_random_uuid(),
  legacy_id integer unique not null,
  name text not null,
  hex text not null,
  personality_type text not null,
  trait text not null,
  created_at timestamptz default now()
);

-- Enable RLS for colors
alter table public.colors enable row level security;

-- Create policy to allow anyone to read colors
create policy "Allow public read access to colors"
on public.colors for select
using (true);


-- 2. Create votes table
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  color_id uuid references public.colors(id) on delete cascade not null,
  region text not null,        -- e.g. seoul, busan
  district text,              -- e.g. gangnam-gu (optional)
  age_group text not null,    -- e.g. 10대, 20대
  gender text,                -- optional
  fingerprint text not null,  -- IP + UserAgent Hash for daily restriction
  created_at timestamptz default now()
);

-- Enable RLS for votes
alter table public.votes enable row level security;

-- Create policy to allow public select (necessary for client-side queries)
create policy "Allow public read access to votes"
on public.votes for select
using (true);

-- Create policy to allow public insert
create policy "Allow public insert to votes"
on public.votes for insert
with check (true);


-- 3. Prevent duplicate votes (Limit to 1 vote per day per fingerprint)
-- A unique constraint on fingerprint and the KST calendar date of created_at.
-- The zone literal makes the expression IMMUTABLE (a bare created_at::date
-- depends on the session timezone and is only STABLE, which indexes reject).
create unique index unique_vote_per_day
on public.votes (fingerprint, ((created_at at time zone 'Asia/Seoul')::date));


-- 4. Create database views and functions for statistics
-- NOTE: All views are declared with security_invoker = on so they run with the
-- caller's (anon) privileges instead of the view owner's. This avoids Supabase's
-- "Security Definer View" lint warning. Reads still succeed because the colors
-- and votes tables both expose public SELECT policies above.

-- View 1: stats_by_region (Counts top colors per region)
create or replace view public.stats_by_region
with (security_invoker = on) as
select
  region,
  color_id,
  count(*) as vote_count,
  row_number() over (partition by region order by count(*) desc) as rank
from public.votes
group by region, color_id;

-- View 2: stats_by_age (Counts color choices by age group with percentages and rank)
create or replace view public.stats_by_age
with (security_invoker = on) as
with age_totals as (
  select
    age_group,
    count(*) as total_count
  from public.votes
  group by age_group
)
select
  v.age_group,
  v.color_id,
  count(*) as vote_count,
  round((count(*)::numeric / t.total_count * 100), 2) as pct,
  row_number() over (partition by v.age_group order by count(*) desc) as rank
from public.votes v
join age_totals t on v.age_group = t.age_group
group by v.age_group, v.color_id, t.total_count;

-- View 3: stats_combined (Combines region + age breakdown with percentages)
create or replace view public.stats_combined
with (security_invoker = on) as
with segment_totals as (
  select
    region,
    age_group,
    count(*) as total_count
  from public.votes
  group by region, age_group
)
select
  v.region,
  v.age_group,
  v.color_id,
  count(*) as vote_count,
  round((count(*)::numeric / s.total_count * 100), 2) as pct
from public.votes v
join segment_totals s on v.region = s.region and v.age_group = s.age_group
group by v.region, v.age_group, v.color_id, s.total_count;

-- View 4: stats_trending (Live Trending momentum: compares a color's share of votes 
--          in the last 1 hour against its share of votes over the last 24 hours)
--   hour_votes = votes in the last 1 hour
--   gain_pct   = (share_1h - share_24h) * 100 (percentage point difference)
--                This prevents crazy 2300% spikes when overall vote volume is low.
create or replace view public.stats_trending
with (security_invoker = on) as
with total_1h as (
  select count(*)::numeric as total_votes_1h
  from public.votes
  where created_at >= now() - interval '1 hour'
),
total_24h as (
  select count(*)::numeric as total_votes_24h
  from public.votes
  where created_at >= now() - interval '24 hours'
),
recent_1h as (
  select color_id, count(*) as votes_1h
  from public.votes
  where created_at >= now() - interval '1 hour'
  group by color_id
),
recent_24h as (
  select color_id, count(*) as votes_24h
  from public.votes
  where created_at >= now() - interval '24 hours'
  group by color_id
)
select
  c.id as color_id,
  coalesce(r.votes_1h, 0) as hour_votes,
  round(
    coalesce(
      (
        (coalesce(r.votes_1h, 0)::numeric / nullif((select total_votes_1h from total_1h), 0) * 100) - 
        (coalesce(y.votes_24h, 0)::numeric / nullif((select total_votes_24h from total_24h), 0) * 100)
      ), 0
    ), 1
  ) as gain_pct
from public.colors c
left join recent_1h r on c.id = r.color_id
left join recent_24h y on c.id = y.color_id
order by gain_pct desc, hour_votes desc;

-- View 5: stats_recent_votes (Ticker news: returns 15 most recent votes)
create or replace view public.stats_recent_votes
with (security_invoker = on) as
select
  v.id,
  v.region,
  v.age_group,
  v.color_id,
  c.name as color_name,
  c.hex as color_hex,
  v.created_at
from public.votes v
join public.colors c on v.color_id = c.id
order by v.created_at desc
limit 15;

-- Grant read access on the views to the API roles (explicit, in case the
-- project's default privileges do not cover newly created views).
grant select on
  public.stats_by_region,
  public.stats_by_age,
  public.stats_combined,
  public.stats_trending,
  public.stats_recent_votes
to anon, authenticated;

-- Function 1: get_colors_by_time_range (Time filter logic for StatsPage)
create or replace function public.get_colors_by_time_range(t_range text)
returns table (
  color_id uuid,
  vote_count bigint
) as $$
declare
  start_date timestamptz;
begin
  if t_range = '오늘' then
    start_date := now() - interval '24 hours';
  elsif t_range = '이번 주' then
    start_date := now() - interval '7 days';
  else
    start_date := '-infinity'::timestamptz;
  end if;

  return query
  select
    c.id as color_id,
    count(v.id) as vote_count
  from public.colors c
  left join public.votes v on c.id = v.color_id and v.created_at >= start_date
  group by c.id;
end;
$$ language plpgsql security definer;

-- Allow the API roles to call the RPC.
grant execute on function public.get_colors_by_time_range(text) to anon, authenticated;


-- 5. Enable Realtime so the client can subscribe to new votes (subscribeVotes()).
-- Idempotent: only adds the table if it is not already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;


-- 6. Insert initial legacy seed colors (Mapped to predefined static UUIDs for consistency)
insert into public.colors (id, legacy_id, name, hex, personality_type, trait) values
  ('f0f9c2d1-bc74-4b53-90d2-97ba5a5d8b8a', 1, '딥 네이비', '#1B2A4A', '냉정형', '분석적이고 신중한'),
  ('a9e9a4f4-5f12-4217-bf3f-91cb61cf2ab0', 2, '로열 블루', '#1464C0', '리더형', '자신감 넘치는'),
  ('7cb9352e-c1cf-41c3-bf6b-712c9bf1f274', 3, '스카이 블루', '#5BA4CF', '자유형', '개방적이고 활달한'),
  ('3d9f9a2b-819a-4c22-92e1-45fa2be416fb', 4, '틸', '#008B8B', '균형형', '이성과 감성의 균형'),
  ('e5a95f2d-ec3d-4c3e-908d-ef30825f381f', 5, '에메랄드', '#00A878', '성장형', '끊임없이 발전하는'),
  ('8cd92b21-4f1c-4b52-9b2f-38fa91cd9a2d', 6, '포레스트', '#2D6A4F', '안정형', '믿음직하고 차분한'),
  ('1c9a4f22-dcf1-456f-87d2-7fb2a1dcf982', 7, '올리브', '#6B7C31', '현실형', '실용적이고 현명한'),
  ('bcfa9f45-d8cf-4bfa-90fa-12ab92cdaef0', 8, '민트', '#5ECFB0', '청량형', '시원하고 생기 있는'),
  ('a5f21c9b-ec22-4cf0-8bfa-dcb2a84fa218', 9, '세이지', '#87A96B', '치유형', '편안함을 주는'),
  ('d2a9fb41-cf19-45e3-82a1-cf92ab1f5cf2', 10, '골든', '#FFD166', '낙관형', '밝고 긍정적인'),
  ('e8b2cf91-12c8-4dfb-90f2-fa12acfa1b2e', 11, '앰버', '#F4A261', '열정형', '따뜻하고 에너지 넘치는'),
  ('fb12a95c-dcf1-4e92-9cf1-ab1cfb2da9f1', 12, '코랄', '#E76F51', '감성형', '풍부한 감수성'),
  ('1ac2d9fa-cb19-4fa2-92f1-ecfa92cdfa21', 13, '테라코타', '#B5500C', '지속형', '끈기 있고 묵직한'),
  ('cf1b2d9a-1290-4bf2-901d-12abac09df10', 14, '크림슨', '#C1121F', '도전형', '두려움 없이 나아가는'),
  ('df2a9b4f-8cf1-4bfb-92b1-ac092bcfda12', 15, '로즈', '#E63946', '강렬형', '강렬하고 직접적인'),
  ('ef219ac0-dcf1-4f2a-89a1-ac219bcf82ab', 16, '핫 핑크', '#FF6B9D', '창의형', '독창적이고 개성 강한'),
  ('a8cf129b-d8fa-4cfb-8ea1-cfba928cfb02', 17, '마젠타', '#D62598', '개성형', '자유롭고 창의적인'),
  ('cf92ab14-ecf9-4cf0-90ab-ac98dc08fa14', 18, '라벤더', '#9B5DE5', '몽상형', '상상력이 풍부한'),
  ('1ab92cda-c0df-4f01-9ac0-12bcaf089df1', 19, '딥 퍼플', '#5A189A', '신비형', '깊이 있고 카리스마 있는'),
  ('b9ac0dc2-df1a-4fa1-92b1-098cfacfa0e2', 20, '인디고', '#3A0CA3', '직관형', '날카로운 통찰력'),
  ('bcfa92cf-1d8f-4cf0-82a1-92ab08dfda2b', 21, '페리윙클', '#8192E6', '공감형', '섬세하고 배려 깊은'),
  ('98fa0dcf-2d10-4fa2-8b9a-12cfa8a09cf1', 22, '버건디', '#800020', '품격형', '우아하고 고집스러운'),
  ('c0dfa982-f12d-4bfb-87b1-ac2dfa981c2f', 23, '실버', '#ADB5BD', '중립형', '유연하고 적응력 강한'),
  ('87fa0bc2-d8fa-4a21-9ab2-8cf0da92cfa2', 24, '슬레이트', '#64748B', '사고형', '객관적이고 냉철한'),
  ('2ab987cd-d8fa-4cb2-87a1-ec92acfb09df', 25, '샌드', '#D4A574', '자연형', '소박하고 여유로운'),
  ('7d8f92ac-c19a-4c22-902d-acfa982cda0b', 26, '카키', '#7D6C46', '성실형', '꾸준하고 신뢰할 수 있는'),
  ('0dfa92cb-cf90-4c22-82ac-098dbcf19ac0', 27, '미드나잇', '#0D1B2A', '내성형', '깊은 사색과 직관'),
  ('8fa2c0df-d2a9-4fb2-80da-9cfa98b0cfdc', 28, '블러시', '#FFB5C8', '낭만형', '따뜻하고 감미로운')
on conflict (legacy_id) do update set
  name = excluded.name,
  hex = excluded.hex,
  personality_type = excluded.personality_type,
  trait = excluded.trait;
