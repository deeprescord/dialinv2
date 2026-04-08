-- ============================================================
-- THE DIAL PROTOCOL — From Light Switches to Dimmers
-- ============================================================

-- DIALS: The schema definitions (who coined "melancholy" as a dial?)
create table public.dials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  range_min real not null default 0,
  range_max real not null default 100,
  category text, -- e.g. "emotion", "genre", "quality", "technical"
  icon text, -- emoji or icon name
  created_by uuid references public.profiles(id) on delete set null,
  usage_count bigint not null default 0, -- how many readings use this dial
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REGISTRY ITEMS: URLs added to the Universal (no copies — links only)
create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  url_hash text not null unique, -- sha256 of normalized URL for dedup
  title text,
  description text,
  thumbnail_url text,
  content_type text, -- "video", "audio", "image", "article", "website", etc.
  domain text, -- extracted domain for display
  meta jsonb default '{}'::jsonb, -- open graph, oembed, etc.
  added_by uuid references public.profiles(id) on delete set null,
  sharing_level text not null default 'private' check (sharing_level in ('private', 'group', 'public')),
  total_dialins bigint not null default 0, -- how many people have dialed in
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DIAL READINGS: A user's subjective dial value on an item
create table public.dial_readings (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  dial_id uuid not null references public.dials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value real not null, -- the subjective reading (within dial's range)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(registry_item_id, dial_id, user_id) -- one reading per user per dial per item
);

-- DIAL-INS: When a user dials into a public item (adds it to their world)
create table public.dialins (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points_earned integer not null default 0,
  created_at timestamptz default now(),
  unique(registry_item_id, user_id) -- one dial-in per user per item
);

-- POINT EVENTS: Ledger of all point transactions
create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, -- positive = earned, negative = spent
  reason text not null, -- "dialin", "content_added", "profile_enriched", "dial_created", "group_share"
  reference_id uuid, -- optional FK to whatever triggered it
  created_at timestamptz default now()
);

-- STATUS TIERS: Airline-style status levels
create table public.status_tiers (
  id serial primary key,
  name text not null unique, -- "Explorer", "Navigator", "Voyager", "Luminary", "Architect"
  min_points bigint not null,
  color text not null, -- hex color for the tier badge
  icon text, -- tier icon
  perks jsonb default '[]'::jsonb
);

-- Seed the tiers
insert into public.status_tiers (name, min_points, color, icon) values
  ('Explorer',    0,       '#71717a', '🌱'),  -- zinc
  ('Navigator',   500,     '#3b82f6', '🧭'),  -- blue
  ('Voyager',     2500,    '#8b5cf6', '🚀'),  -- violet
  ('Luminary',    10000,   '#f59e0b', '✨'),  -- amber
  ('Architect',   50000,   '#ef4444', '🏛️'); -- red/gold

-- USER VAULT: Encrypted personal data that earns value
create table public.user_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_name text not null, -- "location", "interests", "profession", etc.
  encrypted_value text not null, -- encrypted at app level before storage
  points_value integer not null default 10, -- how many points this field is worth
  created_at timestamptz default now(),
  unique(user_id, field_name)
);

-- Add status tracking columns to profiles
alter table public.profiles
  add column if not exists status_tier text not null default 'Explorer',
  add column if not exists vault_points integer not null default 0,
  add column if not exists total_dialins bigint not null default 0,
  add column if not exists total_dials_created bigint not null default 0;

-- INDEXES for performance
create index idx_dial_readings_item on public.dial_readings(registry_item_id);
create index idx_dial_readings_user on public.dial_readings(user_id);
create index idx_dial_readings_dial on public.dial_readings(dial_id);
create index idx_registry_items_sharing on public.registry_items(sharing_level) where sharing_level = 'public';
create index idx_registry_items_url_hash on public.registry_items(url_hash);
create index idx_dialins_user on public.dialins(user_id);
create index idx_dialins_item on public.dialins(registry_item_id);
create index idx_point_events_user on public.point_events(user_id);
create index idx_dials_slug on public.dials(slug);
create index idx_dials_category on public.dials(category);

-- RLS policies
alter table public.dials enable row level security;
alter table public.registry_items enable row level security;
alter table public.dial_readings enable row level security;
alter table public.dialins enable row level security;
alter table public.point_events enable row level security;
alter table public.user_vault enable row level security;

-- Dials: anyone can read, authenticated can create
create policy "dials_read" on public.dials for select using (true);
create policy "dials_insert" on public.dials for insert with check (auth.uid() = created_by);

-- Registry items: public items readable by all, own items always readable
create policy "registry_read_public" on public.registry_items for select
  using (sharing_level = 'public' or added_by = auth.uid());
create policy "registry_insert" on public.registry_items for insert
  with check (auth.uid() = added_by);
create policy "registry_update_own" on public.registry_items for update
  using (auth.uid() = added_by);

-- Dial readings: read own + public item readings, write own
create policy "readings_read" on public.dial_readings for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id and ri.sharing_level = 'public'
    )
  );
create policy "readings_insert" on public.dial_readings for insert
  with check (auth.uid() = user_id);
create policy "readings_update" on public.dial_readings for update
  using (auth.uid() = user_id);

-- Dial-ins: read own, write own
create policy "dialins_read" on public.dialins for select using (user_id = auth.uid());
create policy "dialins_insert" on public.dialins for insert with check (user_id = auth.uid());

-- Point events: read own only
create policy "points_read" on public.point_events for select using (user_id = auth.uid());

-- Vault: own data only
create policy "vault_read" on public.user_vault for select using (user_id = auth.uid());
create policy "vault_insert" on public.user_vault for insert with check (user_id = auth.uid());
create policy "vault_update" on public.user_vault for update using (user_id = auth.uid());
create policy "vault_delete" on public.user_vault for delete using (user_id = auth.uid());

-- Function: award points and update profile
create or replace function public.award_points(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
) returns integer as $$
declare
  new_balance integer;
  new_lifetime integer;
  new_tier text;
begin
  -- Insert ledger event
  insert into public.point_events (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, p_reason, p_reference_id);

  -- Update profile
  update public.profiles
  set points_balance = coalesce(points_balance, 0) + p_amount,
      points_lifetime = coalesce(points_lifetime, 0) + greatest(p_amount, 0)
  where id = p_user_id
  returning points_balance, points_lifetime into new_balance, new_lifetime;

  -- Calculate tier
  select name into new_tier
  from public.status_tiers
  where min_points <= new_lifetime
  order by min_points desc
  limit 1;

  -- Update tier if changed
  update public.profiles
  set status_tier = coalesce(new_tier, 'Explorer')
  where id = p_user_id and status_tier is distinct from new_tier;

  return new_balance;
end;
$$ language plpgsql security definer;

-- Function: dial into a public item
create or replace function public.perform_dialin(
  p_user_id uuid,
  p_registry_item_id uuid
) returns jsonb as $$
declare
  points_awarded integer := 5;
  result jsonb;
begin
  -- Insert dial-in (ignore if already exists)
  insert into public.dialins (registry_item_id, user_id, points_earned)
  values (p_registry_item_id, p_user_id, points_awarded)
  on conflict (registry_item_id, user_id) do nothing;

  if found then
    -- Increment item's dial-in count
    update public.registry_items
    set total_dialins = total_dialins + 1
    where id = p_registry_item_id;

    -- Increment user's dial-in count
    update public.profiles
    set total_dialins = coalesce(total_dialins, 0) + 1
    where id = p_user_id;

    -- Award points
    perform public.award_points(p_user_id, points_awarded, 'dialin', p_registry_item_id);

    result := jsonb_build_object('success', true, 'points', points_awarded, 'new_dialin', true);
  else
    result := jsonb_build_object('success', true, 'points', 0, 'new_dialin', false);
  end if;

  return result;
end;
$$ language plpgsql security definer;
-- ============================================================
-- CORE TRIADS — The 3 dials that triangulate every category
-- ============================================================
-- Every category in the Universal has exactly 3 core dials.
-- These are the minimum dimensions for navigation/search.
-- They auto-attach to any particle entering that category.
-- Users can adjust values but cannot remove core dials.

-- Categories table: the top-level taxonomy
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,             -- "Food", "Music", "Film", etc.
  slug text not null unique,             -- "food", "music", "film"
  description text,
  icon text,                             -- emoji
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Core triads: maps each category to exactly 3 dials
-- dial_role: "what" (classification), "character" (quality), "energy" (intensity)
create table public.core_triads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  dial_id uuid not null references public.dials(id) on delete cascade,
  dial_role text not null check (dial_role in ('what', 'character', 'energy')),
  sort_order integer not null default 0, -- 1, 2, 3
  created_at timestamptz default now(),
  unique(category_id, dial_role),        -- one dial per role per category
  unique(category_id, dial_id)           -- no duplicate dials in a triad
);

-- AI context: scraped metadata stored per registry item
-- Separate from registry_items.meta to keep scrape data clean
create table public.ai_context (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  objects text[] default '{}',           -- detected objects: ["plate", "burrata", "tomatoes"]
  category_slug text,                    -- auto-detected category: "food"
  subcategory text,                      -- "appetizer"
  tags text[] default '{}',              -- extracted hashtags / keywords
  setting text,                          -- "restaurant, indoor, evening"
  colors_dominant text[] default '{}',   -- ["#FFFFFF", "#E83A30"]
  text_detected text,                    -- OCR text if any
  cuisine text,                          -- food-specific
  genre text,                            -- music/film-specific
  era text,                              -- decade/period
  confidence real default 0,             -- AI confidence 0-1
  raw_response jsonb default '{}'::jsonb,-- full AI response for debugging
  created_at timestamptz default now(),
  unique(registry_item_id)               -- one context per item
);

-- Auto-dials: AI-suggested dial values before user confirmation
create table public.auto_dials (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  dial_id uuid not null references public.dials(id) on delete cascade,
  suggested_value real not null,         -- AI's best guess
  confidence real default 0,             -- how confident the AI is
  source text not null default 'ai',     -- 'ai', 'location', 'community_median'
  confirmed boolean not null default false, -- user accepted/adjusted?
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  unique(registry_item_id, dial_id)      -- one suggestion per dial per item
);

-- Add location to registry_items for geo-search
alter table public.registry_items
  add column if not exists latitude real,
  add column if not exists longitude real,
  add column if not exists place_name text,
  add column if not exists place_type text;

-- Add is_core flag to dials so we can distinguish system dials from user-created
alter table public.dials
  add column if not exists is_core boolean not null default false;

-- Indexes
create index idx_core_triads_category on public.core_triads(category_id);
create index idx_ai_context_item on public.ai_context(registry_item_id);
create index idx_ai_context_category on public.ai_context(category_slug);
create index idx_auto_dials_item on public.auto_dials(registry_item_id);
create index idx_auto_dials_unconfirmed on public.auto_dials(registry_item_id) where confirmed = false;
create index idx_registry_items_location on public.registry_items(latitude, longitude) where latitude is not null;
create index idx_registry_items_place on public.registry_items(place_name) where place_name is not null;
create index idx_dials_core on public.dials(is_core) where is_core = true;

-- RLS
alter table public.categories enable row level security;
alter table public.core_triads enable row level security;
alter table public.ai_context enable row level security;
alter table public.auto_dials enable row level security;

-- Categories: readable by all (system data)
create policy "categories_read" on public.categories for select using (true);

-- Core triads: readable by all (system data)
create policy "core_triads_read" on public.core_triads for select using (true);

-- AI context: readable if you can see the registry item
create policy "ai_context_read" on public.ai_context for select
  using (
    exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id
        and (ri.sharing_level = 'public' or ri.added_by = auth.uid())
    )
  );
create policy "ai_context_insert" on public.ai_context for insert
  with check (
    exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id and ri.added_by = auth.uid()
    )
  );

-- Auto-dials: readable/writable by item owner
create policy "auto_dials_read" on public.auto_dials for select
  using (
    exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id
        and (ri.sharing_level = 'public' or ri.added_by = auth.uid())
    )
  );
create policy "auto_dials_insert" on public.auto_dials for insert
  with check (
    exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id and ri.added_by = auth.uid()
    )
  );
create policy "auto_dials_update" on public.auto_dials for update
  using (
    exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id and ri.added_by = auth.uid()
    )
  );

-- ============================================================
-- SEED: Categories + Core Dials
-- ============================================================

-- Insert categories
insert into public.categories (name, slug, icon, sort_order, description) values
  ('Food',     'food',     '🍽️', 1,  'Restaurants, recipes, ingredients, dining experiences'),
  ('Music',    'music',    '🎵', 2,  'Songs, albums, artists, playlists, live performances'),
  ('Film',     'film',     '🎬', 3,  'Movies, shows, documentaries, shorts'),
  ('Places',   'places',   '📍', 4,  'Locations, venues, cities, nature, travel destinations'),
  ('People',   'people',   '👤', 5,  'Professionals, creators, mentors, public figures'),
  ('Products', 'products', '📦', 6,  'Physical goods, software, tools, services'),
  ('Ideas',    'ideas',    '💡', 7,  'Articles, papers, concepts, philosophies, debates'),
  ('News',     'news',     '📰', 8,  'Current events, reporting, analysis'),
  ('Health',   'health',   '💚', 9,  'Fitness, nutrition, mental health, medicine'),
  ('Sports',   'sports',   '⚽', 10, 'Games, athletes, teams, training, highlights');

-- Insert core dials (is_core = true, range 0-100 as existing schema)
-- FOOD triad: Cuisine Type, Richness, Adventurousness
insert into public.dials (name, slug, description, range_min, range_max, category, icon, is_core) values
  ('Cuisine Type',     'cuisine-type',     'What cuisine tradition — from comfort/home to global/fusion',    0, 100, 'food', '🌍', true),
  ('Richness',         'richness',         'Light and clean to heavy and indulgent',                         0, 100, 'food', '🧈', true),
  ('Adventurousness',  'adventurousness',  'Familiar and safe to exotic and experimental',                   0, 100, 'food', '🧭', true),

-- MUSIC triad: Genre, Decade, Energy
  ('Genre',            'genre',            'Acoustic/folk to electronic/synthetic',                           0, 100, 'music', '🎸', true),
  ('Decade',           'decade',           'Classic/vintage to contemporary/future',                          0, 100, 'music', '📅', true),
  ('Energy',           'energy',           'Calm and ambient to intense and driving',                         0, 100, 'music', '⚡', true),

-- FILM triad: Genre, Era, Intensity
  ('Film Genre',       'film-genre',       'Documentary/realist to fantasy/surreal',                          0, 100, 'film', '🎭', true),
  ('Film Era',         'film-era',         'Classic/golden age to modern/cutting edge',                       0, 100, 'film', '🎞️', true),
  ('Intensity',        'intensity',        'Gentle and meditative to visceral and gripping',                  0, 100, 'film', '🔥', true),

-- PLACES triad: Purpose, Formality, Vibe
  ('Purpose',          'purpose',          'Functional/utilitarian to experiential/destination',              0, 100, 'places', '🎯', true),
  ('Formality',        'formality',        'Casual and laid-back to upscale and polished',                   0, 100, 'places', '👔', true),
  ('Vibe',             'vibe',             'Quiet and intimate to buzzy and social',                         0, 100, 'places', '✨', true),

-- PEOPLE triad: Domain, Experience, Warmth
  ('Domain',           'domain',           'Creative/artistic to technical/analytical',                       0, 100, 'people', '🧠', true),
  ('Experience',       'experience',       'Emerging/learning to veteran/mastered',                           0, 100, 'people', '📈', true),
  ('Warmth',           'warmth',           'Reserved and professional to open and approachable',              0, 100, 'people', '🤝', true),

-- PRODUCTS triad: Category, Quality, Value
  ('Product Type',     'product-type',     'Basic/essential to premium/luxury',                               0, 100, 'products', '🏷️', true),
  ('Quality',          'quality',          'Budget/disposable to heirloom/built-to-last',                    0, 100, 'products', '⭐', true),
  ('Value',            'value',            'Overpriced for what it is to incredible deal',                   0, 100, 'products', '💰', true),

-- IDEAS triad: Field, Complexity, Novelty
  ('Field',            'field',            'Practical/applied to theoretical/abstract',                       0, 100, 'ideas', '🔬', true),
  ('Complexity',       'complexity',       'Accessible to everyone to requires deep expertise',              0, 100, 'ideas', '🧩', true),
  ('Novelty',          'novelty',          'Established consensus to radical/contrarian',                     0, 100, 'ideas', '🆕', true),

-- NEWS triad: Scope, Impact, Credibility
  ('Scope',            'news-scope',       'Local/community to global/civilization-scale',                    0, 100, 'news', '🌐', true),
  ('Impact',           'news-impact',      'Informational/FYI to life-altering/urgent',                      0, 100, 'news', '💥', true),
  ('Credibility',      'credibility',      'Opinion/speculation to verified/sourced',                         0, 100, 'news', '✅', true),

-- HEALTH triad: Focus, Difficulty, Evidence
  ('Health Focus',     'health-focus',     'Prevention/wellness to treatment/recovery',                       0, 100, 'health', '🎯', true),
  ('Difficulty',       'difficulty',       'Beginner-friendly to advanced/demanding',                         0, 100, 'health', '💪', true),
  ('Evidence',         'evidence',         'Anecdotal/traditional to clinically proven',                      0, 100, 'health', '🔬', true),

-- SPORTS triad: Sport Type, Level, Excitement
  ('Sport Type',       'sport-type',       'Individual/meditative to team/competitive',                       0, 100, 'sports', '🏆', true),
  ('Level',            'level',            'Amateur/recreational to elite/professional',                      0, 100, 'sports', '📊', true),
  ('Excitement',       'excitement',       'Strategic and methodical to explosive and unpredictable',         0, 100, 'sports', '🎉', true);

-- Now wire the triads: link each category to its 3 core dials
-- We use a DO block to look up the IDs dynamically

do $$
declare
  -- category IDs
  cat_food uuid;     cat_music uuid;    cat_film uuid;
  cat_places uuid;   cat_people uuid;   cat_products uuid;
  cat_ideas uuid;    cat_news uuid;     cat_health uuid;
  cat_sports uuid;
begin
  select id into cat_food     from public.categories where slug = 'food';
  select id into cat_music    from public.categories where slug = 'music';
  select id into cat_film     from public.categories where slug = 'film';
  select id into cat_places   from public.categories where slug = 'places';
  select id into cat_people   from public.categories where slug = 'people';
  select id into cat_products from public.categories where slug = 'products';
  select id into cat_ideas    from public.categories where slug = 'ideas';
  select id into cat_news     from public.categories where slug = 'news';
  select id into cat_health   from public.categories where slug = 'health';
  select id into cat_sports   from public.categories where slug = 'sports';

  -- FOOD
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_food, (select id from public.dials where slug = 'cuisine-type'),    'what',      1),
    (cat_food, (select id from public.dials where slug = 'richness'),        'character', 2),
    (cat_food, (select id from public.dials where slug = 'adventurousness'), 'energy',    3);

  -- MUSIC
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_music, (select id from public.dials where slug = 'genre'),  'what',      1),
    (cat_music, (select id from public.dials where slug = 'decade'), 'character', 2),
    (cat_music, (select id from public.dials where slug = 'energy'), 'energy',    3);

  -- FILM
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_film, (select id from public.dials where slug = 'film-genre'),  'what',      1),
    (cat_film, (select id from public.dials where slug = 'film-era'),    'character', 2),
    (cat_film, (select id from public.dials where slug = 'intensity'),   'energy',    3);

  -- PLACES
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_places, (select id from public.dials where slug = 'purpose'),    'what',      1),
    (cat_places, (select id from public.dials where slug = 'formality'),  'character', 2),
    (cat_places, (select id from public.dials where slug = 'vibe'),       'energy',    3);

  -- PEOPLE
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_people, (select id from public.dials where slug = 'domain'),     'what',      1),
    (cat_people, (select id from public.dials where slug = 'experience'), 'character', 2),
    (cat_people, (select id from public.dials where slug = 'warmth'),     'energy',    3);

  -- PRODUCTS
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_products, (select id from public.dials where slug = 'product-type'), 'what',      1),
    (cat_products, (select id from public.dials where slug = 'quality'),      'character', 2),
    (cat_products, (select id from public.dials where slug = 'value'),        'energy',    3);

  -- IDEAS
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_ideas, (select id from public.dials where slug = 'field'),      'what',      1),
    (cat_ideas, (select id from public.dials where slug = 'complexity'), 'character', 2),
    (cat_ideas, (select id from public.dials where slug = 'novelty'),    'energy',    3);

  -- NEWS
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_news, (select id from public.dials where slug = 'news-scope'),  'what',      1),
    (cat_news, (select id from public.dials where slug = 'news-impact'), 'character', 2),
    (cat_news, (select id from public.dials where slug = 'credibility'), 'energy',    3);

  -- HEALTH
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_health, (select id from public.dials where slug = 'health-focus'), 'what',      1),
    (cat_health, (select id from public.dials where slug = 'difficulty'),   'character', 2),
    (cat_health, (select id from public.dials where slug = 'evidence'),     'energy',    3);

  -- SPORTS
  insert into public.core_triads (category_id, dial_id, dial_role, sort_order)
  values
    (cat_sports, (select id from public.dials where slug = 'sport-type'),  'what',      1),
    (cat_sports, (select id from public.dials where slug = 'level'),       'character', 2),
    (cat_sports, (select id from public.dials where slug = 'excitement'),  'energy',    3);
end $$;

-- ============================================================
-- FUNCTION: Get core triad dials for a category
-- ============================================================
create or replace function public.get_core_triad(p_category_slug text)
returns table (
  dial_id uuid,
  dial_name text,
  dial_slug text,
  dial_description text,
  dial_role text,
  range_min real,
  range_max real,
  icon text,
  sort_order integer
) as $$
begin
  return query
  select
    d.id as dial_id,
    d.name as dial_name,
    d.slug as dial_slug,
    d.description as dial_description,
    ct.dial_role,
    d.range_min,
    d.range_max,
    d.icon,
    ct.sort_order
  from public.core_triads ct
  join public.dials d on d.id = ct.dial_id
  join public.categories c on c.id = ct.category_id
  where c.slug = p_category_slug
  order by ct.sort_order;
end;
$$ language plpgsql stable;

-- ============================================================
-- FUNCTION: Auto-assign core triad dials to a registry item
-- Creates auto_dials rows with suggested values from AI context
-- ============================================================
create or replace function public.assign_core_triad(
  p_registry_item_id uuid,
  p_category_slug text,
  p_suggested_values jsonb default '{}'::jsonb
  -- expects: {"what": 65.0, "character": 42.0, "energy": 78.0}
) returns setof public.auto_dials as $$
declare
  triad record;
  suggested real;
begin
  for triad in
    select ct.dial_id, ct.dial_role
    from public.core_triads ct
    join public.categories c on c.id = ct.category_id
    where c.slug = p_category_slug
    order by ct.sort_order
  loop
    -- Get suggested value for this role, default to midpoint (50)
    suggested := coalesce(
      (p_suggested_values ->> triad.dial_role)::real,
      50.0
    );

    return query
    insert into public.auto_dials (registry_item_id, dial_id, suggested_value, confidence, source)
    values (p_registry_item_id, triad.dial_id, suggested, 0.5, 'ai')
    on conflict (registry_item_id, dial_id)
    do update set
      suggested_value = excluded.suggested_value,
      confidence = excluded.confidence
    returning *;
  end loop;
end;
$$ language plpgsql security definer;
-- ============================================================
-- DIAL DYNAMICS — Time-series voting with UIP metrics
-- ============================================================
-- Every dial reading is a vote. First voter sets the baseline.
-- Each subsequent voter sees the running average, then stores
-- their own value. Public = consensus. Private = your truth.
-- The gap between them = p(1-p) = the interaction potential.

-- ── Dial reading history (time-series, append-only) ──
-- The existing dial_readings table stores current values.
-- This table stores the full history — every change, every moment.

create table public.dial_reading_history (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  dial_id uuid not null references public.dials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value real not null,                     -- the user's subjective value (0-100)
  public_avg_at_read real,                 -- what the public average was when they dialed
  public_count_at_read integer,            -- how many votes existed when they dialed
  delta_from_public real,                  -- value - public_avg_at_read (their "edge")
  created_at timestamptz default now()
);

-- ── Public dial aggregates (materialized consensus) ──
-- One row per (item, dial) — the living average.

create table public.dial_consensus (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade,
  dial_id uuid not null references public.dials(id) on delete cascade,
  -- Consensus stats
  avg_value real not null default 50,      -- running average
  stddev_value real not null default 0,    -- standard deviation
  min_value real not null default 50,
  max_value real not null default 50,
  vote_count integer not null default 0,   -- total voters
  -- UIP metrics (recomputed on each vote)
  kernel real not null default 0.25,       -- p(1-p) where p = normalized avg/100
  coherence real not null default 0,       -- volume momentum (votes/day vs avg)
  delta real not null default 0,           -- rate of change of avg over time
  omega real not null default 0.5,         -- alignment: micro vs macro trend
  gamma real not null default 0,           -- velocity of value change
  lambda real not null default 0,          -- liquidity (vote count confidence)
  amplitude real not null default 0,       -- max_value - min_value (spread)
  phase text not null default 'nascent',   -- nascent | active | converging | settled | ruptured
  -- Timestamps
  first_vote_at timestamptz,
  last_vote_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(registry_item_id, dial_id)
);

-- ── Indexes ──
create index idx_dial_history_item on public.dial_reading_history(registry_item_id);
create index idx_dial_history_user on public.dial_reading_history(user_id);
create index idx_dial_history_dial on public.dial_reading_history(dial_id);
create index idx_dial_history_ts on public.dial_reading_history(created_at);
create index idx_dial_consensus_item on public.dial_consensus(registry_item_id);
create index idx_dial_consensus_phase on public.dial_consensus(phase);
create index idx_dial_consensus_kernel on public.dial_consensus(kernel desc);

-- ── RLS ──
alter table public.dial_reading_history enable row level security;
alter table public.dial_consensus enable row level security;

-- History: read own + public items
create policy "history_read" on public.dial_reading_history for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.registry_items ri
      where ri.id = registry_item_id and ri.sharing_level = 'public'
    )
  );
create policy "history_insert" on public.dial_reading_history for insert
  with check (user_id = auth.uid());

-- Consensus: readable by all (it's the public average)
create policy "consensus_read" on public.dial_consensus for select using (true);

-- ============================================================
-- FUNCTION: Cast a dial vote
-- ============================================================
-- This is the core voting function. It:
-- 1. Reads the current consensus (what the voter sees)
-- 2. Records the vote + history (what the voter chose)
-- 3. Recomputes consensus + UIP metrics
-- 4. Returns both public and private values

create or replace function public.cast_dial_vote(
  p_user_id uuid,
  p_registry_item_id uuid,
  p_dial_id uuid,
  p_value real
) returns jsonb as $$
declare
  -- Current consensus before this vote
  curr_avg real;
  curr_count integer;
  curr_stddev real;
  -- After vote
  new_avg real;
  new_count integer;
  new_stddev real;
  new_min real;
  new_max real;
  -- UIP metrics
  p_norm real;          -- normalized avg to [0,1]
  v_kernel real;        -- p(1-p)
  v_delta real;         -- rate of change
  v_amplitude real;     -- spread
  v_lambda real;        -- liquidity confidence
  v_phase text;         -- phase classification
  v_omega real;         -- micro/macro alignment
  v_gamma real;         -- velocity
  v_coherence real;     -- volume momentum
  -- History
  prev_avg real;
  vote_delta real;
  -- Aggregation helpers
  recent_avg real;
  all_time_avg real;
  votes_last_24h integer;
  votes_last_7d integer;
  is_first_vote boolean;
begin
  -- ── Step 1: Get current consensus ──
  select avg_value, vote_count, stddev_value
  into curr_avg, curr_count, curr_stddev
  from public.dial_consensus
  where registry_item_id = p_registry_item_id and dial_id = p_dial_id;

  is_first_vote := curr_count is null;
  curr_avg := coalesce(curr_avg, 50);
  curr_count := coalesce(curr_count, 0);

  -- ── Step 2: Upsert the user's current reading ──
  insert into public.dial_readings (registry_item_id, dial_id, user_id, value)
  values (p_registry_item_id, p_dial_id, p_user_id, p_value)
  on conflict (registry_item_id, dial_id, user_id)
  do update set value = p_value, updated_at = now();

  -- ── Step 3: Record history (append-only time series) ──
  vote_delta := p_value - curr_avg;

  insert into public.dial_reading_history (
    registry_item_id, dial_id, user_id, value,
    public_avg_at_read, public_count_at_read, delta_from_public
  ) values (
    p_registry_item_id, p_dial_id, p_user_id, p_value,
    curr_avg, curr_count, vote_delta
  );

  -- ── Step 4: Recompute consensus from all readings ──
  select
    avg(dr.value),
    count(*),
    coalesce(stddev_pop(dr.value), 0),
    min(dr.value),
    max(dr.value)
  into new_avg, new_count, new_stddev, new_min, new_max
  from public.dial_readings dr
  where dr.registry_item_id = p_registry_item_id
    and dr.dial_id = p_dial_id;

  -- ── Step 5: Compute UIP metrics ──

  -- KERNEL: p(1-p) where p = avg normalized to [0,1]
  p_norm := new_avg / 100.0;
  v_kernel := p_norm * (1.0 - p_norm);
  -- Normalize by max (0.25)
  v_kernel := least(v_kernel / 0.25, 1.0);

  -- AMPLITUDE: spread of opinions
  v_amplitude := new_max - new_min;

  -- LAMBDA: liquidity/confidence (log scale, saturates at ~100 votes)
  v_lambda := least(ln(greatest(new_count, 1) + 1) / ln(101), 1.0);

  -- DELTA: rate of change — compare last 10 votes avg to all-time avg
  select avg(value) into recent_avg
  from (
    select value from public.dial_reading_history
    where registry_item_id = p_registry_item_id
      and dial_id = p_dial_id
    order by created_at desc
    limit 10
  ) recent;
  recent_avg := coalesce(recent_avg, new_avg);
  v_delta := (recent_avg - new_avg) / greatest(new_stddev, 1.0);

  -- OMEGA: micro/macro trend alignment
  -- micro = last 5 votes trend, macro = last 50 votes trend
  -- We use the sign of each trend's slope and compute cosine similarity
  declare
    micro_trend real;
    macro_trend real;
    phi_micro real;
    phi_macro real;
  begin
    -- Micro: avg of last 5 deltas
    select avg(delta_from_public) into micro_trend
    from (
      select delta_from_public from public.dial_reading_history
      where registry_item_id = p_registry_item_id
        and dial_id = p_dial_id
      order by created_at desc
      limit 5
    ) micro;
    micro_trend := coalesce(micro_trend, 0);

    -- Macro: avg of last 50 deltas
    select avg(delta_from_public) into macro_trend
    from (
      select delta_from_public from public.dial_reading_history
      where registry_item_id = p_registry_item_id
        and dial_id = p_dial_id
      order by created_at desc
      limit 50
    ) macro;
    macro_trend := coalesce(macro_trend, 0);

    -- Omega = 0.5 * (1 + cos(phi_micro - phi_macro))
    phi_micro := atan2(micro_trend, 1.0);
    phi_macro := atan2(macro_trend, 1.0);
    v_omega := 0.5 * (1.0 + cos(phi_micro - phi_macro));
  end;

  -- GAMMA: velocity — how fast is the value moving?
  v_gamma := abs(v_delta) * v_omega;

  -- COHERENCE: vote velocity (recent votes vs average rate)
  select count(*) into votes_last_24h
  from public.dial_reading_history
  where registry_item_id = p_registry_item_id
    and dial_id = p_dial_id
    and created_at > now() - interval '24 hours';

  select count(*) into votes_last_7d
  from public.dial_reading_history
  where registry_item_id = p_registry_item_id
    and dial_id = p_dial_id
    and created_at > now() - interval '7 days';

  v_coherence := case
    when votes_last_7d < 7 then 0.5  -- not enough data
    else least(votes_last_24h::real / greatest(votes_last_7d::real / 7.0, 0.1) / 3.0, 1.0)
  end;

  -- PHASE: classify the dial's lifecycle
  v_phase := case
    when new_count < 3 then 'nascent'
    when v_kernel < 0.05 then 'settled'          -- consensus collapsed
    when v_kernel > 0.20 and v_gamma > 0.5 then 'ruptured'  -- high disagreement + fast movement
    when new_stddev < 10 and new_count > 10 then 'converging'
    else 'active'
  end;

  -- ── Step 6: Upsert consensus ──
  insert into public.dial_consensus (
    registry_item_id, dial_id,
    avg_value, stddev_value, min_value, max_value, vote_count,
    kernel, coherence, delta, omega, gamma, lambda, amplitude, phase,
    first_vote_at, last_vote_at, updated_at
  ) values (
    p_registry_item_id, p_dial_id,
    new_avg, new_stddev, new_min, new_max, new_count,
    v_kernel, v_coherence, v_delta, v_omega, v_gamma, v_lambda, v_amplitude, v_phase,
    case when is_first_vote then now() else null end, now(), now()
  )
  on conflict (registry_item_id, dial_id)
  do update set
    avg_value = new_avg,
    stddev_value = new_stddev,
    min_value = new_min,
    max_value = new_max,
    vote_count = new_count,
    kernel = v_kernel,
    coherence = v_coherence,
    delta = v_delta,
    omega = v_omega,
    gamma = v_gamma,
    lambda = v_lambda,
    amplitude = v_amplitude,
    phase = v_phase,
    first_vote_at = case when dial_consensus.first_vote_at is null then now() else dial_consensus.first_vote_at end,
    last_vote_at = now(),
    updated_at = now();

  -- ── Step 7: Award points ──
  perform public.award_points(p_user_id, 1, 'dial_reading', p_dial_id);

  -- ── Return both public and private ──
  return jsonb_build_object(
    'success', true,
    'private', jsonb_build_object(
      'value', p_value,
      'delta_from_public', vote_delta,
      'is_first_vote', is_first_vote
    ),
    'public', jsonb_build_object(
      'avg', round(new_avg::numeric, 2),
      'stddev', round(new_stddev::numeric, 2),
      'count', new_count,
      'min', new_min,
      'max', new_max
    ),
    'uip', jsonb_build_object(
      'kernel', round(v_kernel::numeric, 4),       -- p(1-p): disagreement potential
      'coherence', round(v_coherence::numeric, 4),  -- vote momentum
      'delta', round(v_delta::numeric, 4),           -- rate of avg change
      'omega', round(v_omega::numeric, 4),           -- micro/macro alignment
      'gamma', round(v_gamma::numeric, 4),           -- velocity of change
      'lambda', round(v_lambda::numeric, 4),         -- liquidity/confidence
      'amplitude', round(v_amplitude::numeric, 2),   -- opinion spread
      'phase', v_phase                                -- lifecycle stage
    )
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: Get consensus + UIP metrics for an item's dials
-- ============================================================
create or replace function public.get_dial_dynamics(
  p_registry_item_id uuid,
  p_user_id uuid default null
) returns jsonb as $$
declare
  result jsonb := '[]'::jsonb;
  dial_row record;
begin
  for dial_row in
    select
      dc.*,
      d.name as dial_name,
      d.slug as dial_slug,
      d.icon as dial_icon,
      d.is_core,
      dr.value as user_value,
      dr.value - dc.avg_value as user_delta
    from public.dial_consensus dc
    join public.dials d on d.id = dc.dial_id
    left join public.dial_readings dr
      on dr.registry_item_id = dc.registry_item_id
      and dr.dial_id = dc.dial_id
      and dr.user_id = p_user_id
    where dc.registry_item_id = p_registry_item_id
    order by d.is_core desc, dc.vote_count desc
  loop
    result := result || jsonb_build_object(
      'dial_id', dial_row.dial_id,
      'dial_name', dial_row.dial_name,
      'dial_slug', dial_row.dial_slug,
      'dial_icon', dial_row.dial_icon,
      'is_core', dial_row.is_core,
      'public', jsonb_build_object(
        'avg', round(dial_row.avg_value::numeric, 2),
        'stddev', round(dial_row.stddev_value::numeric, 2),
        'count', dial_row.vote_count,
        'min', dial_row.min_value,
        'max', dial_row.max_value
      ),
      'private', case when dial_row.user_value is not null then
        jsonb_build_object(
          'value', dial_row.user_value,
          'delta', round(dial_row.user_delta::numeric, 2)
        )
      else null end,
      'uip', jsonb_build_object(
        'kernel', round(dial_row.kernel::numeric, 4),
        'coherence', round(dial_row.coherence::numeric, 4),
        'delta', round(dial_row.delta::numeric, 4),
        'omega', round(dial_row.omega::numeric, 4),
        'gamma', round(dial_row.gamma::numeric, 4),
        'lambda', round(dial_row.lambda::numeric, 4),
        'amplitude', round(dial_row.amplitude::numeric, 2),
        'phase', dial_row.phase
      )
    );
  end loop;

  return result;
end;
$$ language plpgsql stable security definer;
-- ============================================================
-- THE 10D GATE — Universal dials that apply to ALL content
-- ============================================================
-- Core triads = WHERE something is (navigation within category)
-- 10D dials = WHAT something is worth (marketplace evaluation)
--
-- Every item is a share. The 10D dials are the bids and asks.
-- The consensus is the market price. Your divergence is your edge.
-- Demographics filter whose bids you see.

-- ── Insert the 10 universal dials ──
-- These are NOT category-specific. They apply to everything.
-- is_core = true, category = 'universal'

insert into public.dials (name, slug, description, range_min, range_max, category, icon, is_core) values
  -- D1: IDENTITY — handled by core triads, no universal dial needed

  -- D2: TRUTH — the binary. Is this real, accurate, honest?
  ('Truth',       'truth',       'How true/accurate/honest is this? 0 = misleading/false, 100 = verified/factual',
   0, 100, 'universal', '🎯', true),

  -- D3: QUALITY — the full map. How good is this?
  ('Quality',     'quality-10d', 'Overall quality of execution/craft. 0 = poor, 100 = masterful',
   0, 100, 'universal', '⭐', true),

  -- D4: IMPACT — rate of change. How much does this move you?
  ('Impact',      'impact',      'How much does this change something? 0 = forgettable, 100 = life-changing',
   0, 100, 'universal', '💥', true),

  -- D5: RELEVANCE — trajectory. Does this matter right now?
  ('Relevance',   'relevance',   'How relevant is this to what matters now? 0 = outdated/niche, 100 = essential/timely',
   0, 100, 'universal', '🔗', true),

  -- D6: NOVELTY — probability space. Is this new information?
  ('Novelty',     'novelty-10d', 'How new/original is this? 0 = derivative/known, 100 = never seen before',
   0, 100, 'universal', '🆕', true),

  -- D7: UNIVERSALITY — invariant. Does this apply broadly?
  ('Universality', 'universality','Does this apply broadly or narrowly? 0 = hyper-niche, 100 = applies to everyone',
   0, 100, 'universal', '🌍', true),

  -- D8: CONNECTION — topology. How does this relate to other things?
  ('Connection',  'connection',  'How well does this connect to other ideas/content? 0 = isolated, 100 = deeply linked',
   0, 100, 'universal', '🔄', true),

  -- D9: EXPERTISE — what level of knowledge does this represent?
  ('Expertise',   'expertise-10d','Level of expertise/authority behind this. 0 = amateur/casual, 100 = world-class expert',
   0, 100, 'universal', '🎓', true),

  -- D10: RESONANCE — the fold. Does this land?
  ('Resonance',   'resonance',   'Does this land with you? Gut check. 0 = nothing, 100 = deeply moved',
   0, 100, 'universal', '🔔', true);

-- ============================================================
-- ITEM SCORE — The "share price" of every item
-- ============================================================
-- Composite score computed from 10D dials + engagement signals.
-- This is what makes items move up and down like shares.

create table public.item_scores (
  id uuid primary key default gen_random_uuid(),
  registry_item_id uuid not null references public.registry_items(id) on delete cascade unique,

  -- The share price: weighted composite of 10D consensus averages
  score real not null default 0,             -- 0-100 composite
  score_prev real not null default 0,        -- previous score (for delta)
  score_delta real not null default 0,       -- current - previous (momentum)
  score_velocity real not null default 0,    -- rate of score change

  -- Individual 10D consensus values (denormalized for fast reads)
  d_truth real,
  d_quality real,
  d_impact real,
  d_relevance real,
  d_novelty real,
  d_universality real,
  d_connection real,
  d_expertise real,
  d_resonance real,

  -- Engagement signals (feed into score)
  total_votes integer not null default 0,    -- across all dials
  unique_voters integer not null default 0,  -- distinct users
  vote_velocity real not null default 0,     -- votes per hour (recent)
  view_count integer not null default 0,
  plant_count integer not null default 0,    -- how many people added to their world

  -- Market dynamics
  kernel_avg real not null default 0.25,     -- avg kernel across all 10D dials
  phase text not null default 'nascent',     -- derived from most active phase

  -- Timestamps
  first_scored_at timestamptz,
  last_scored_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_item_scores_score on public.item_scores(score desc);
create index idx_item_scores_delta on public.item_scores(score_delta desc);
create index idx_item_scores_velocity on public.item_scores(vote_velocity desc);
create index idx_item_scores_truth on public.item_scores(d_truth desc) where d_truth is not null;
create index idx_item_scores_quality on public.item_scores(d_quality desc) where d_quality is not null;

alter table public.item_scores enable row level security;
create policy "item_scores_read" on public.item_scores for select using (true);

-- ============================================================
-- DEMOGRAPHIC PROFILES — The comb filter
-- ============================================================
-- Users opt-in to share demographic dimensions.
-- These are NOT in the vault (vault is private/encrypted).
-- These are public facets used for filtering: "show me what
-- chefs rated highly" or "what do 30-somethings in Oakland think"

create table public.demographic_facets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  facet_type text not null,  -- 'age_range', 'profession', 'location', 'expertise_area', 'culture'
  facet_value text not null, -- '25-34', 'chef', 'oakland-ca', 'food', 'indian'
  verified boolean not null default false, -- future: verified by proof
  created_at timestamptz default now(),
  unique(user_id, facet_type)
);

create index idx_demographic_facets_type on public.demographic_facets(facet_type, facet_value);
create index idx_demographic_facets_user on public.demographic_facets(user_id);

alter table public.demographic_facets enable row level security;
-- Facets are public by design (that's the point — filterable)
create policy "facets_read" on public.demographic_facets for select using (true);
create policy "facets_insert" on public.demographic_facets for insert with check (user_id = auth.uid());
create policy "facets_update" on public.demographic_facets for update using (user_id = auth.uid());
create policy "facets_delete" on public.demographic_facets for delete using (user_id = auth.uid());

-- ============================================================
-- FUNCTION: Recompute item score from 10D consensus
-- ============================================================
create or replace function public.recompute_item_score(p_registry_item_id uuid)
returns public.item_scores as $$
declare
  result public.item_scores;
  prev_score real;
  new_score real;
  d record;
  total_k real := 0;
  dial_count integer := 0;
  -- 10D values
  vals record;
begin
  -- Get previous score
  select score into prev_score from public.item_scores
  where registry_item_id = p_registry_item_id;
  prev_score := coalesce(prev_score, 0);

  -- Collect 10D consensus values
  select
    max(case when d.slug = 'truth' then dc.avg_value end) as truth,
    max(case when d.slug = 'quality-10d' then dc.avg_value end) as quality,
    max(case when d.slug = 'impact' then dc.avg_value end) as impact,
    max(case when d.slug = 'relevance' then dc.avg_value end) as relevance,
    max(case when d.slug = 'novelty-10d' then dc.avg_value end) as novelty,
    max(case when d.slug = 'universality' then dc.avg_value end) as universality,
    max(case when d.slug = 'connection' then dc.avg_value end) as connection,
    max(case when d.slug = 'expertise-10d' then dc.avg_value end) as expertise,
    max(case when d.slug = 'resonance' then dc.avg_value end) as resonance,
    avg(dc.kernel) as avg_kernel,
    count(*) as dial_count
  into vals
  from public.dial_consensus dc
  join public.dials d on d.id = dc.dial_id
  where dc.registry_item_id = p_registry_item_id
    and d.category = 'universal';

  -- Weighted composite score
  -- Truth and Quality weighted higher (they're the bid/ask foundation)
  new_score := (
    coalesce(vals.truth, 50) * 0.20 +       -- Truth is king (20%)
    coalesce(vals.quality, 50) * 0.15 +      -- Quality matters (15%)
    coalesce(vals.impact, 50) * 0.12 +       -- Impact (12%)
    coalesce(vals.resonance, 50) * 0.12 +    -- Resonance (12%)
    coalesce(vals.relevance, 50) * 0.10 +    -- Relevance (10%)
    coalesce(vals.expertise, 50) * 0.10 +    -- Expertise (10%)
    coalesce(vals.novelty, 50) * 0.07 +      -- Novelty (7%)
    coalesce(vals.universality, 50) * 0.05 + -- Universality (5%)
    coalesce(vals.connection, 50) * 0.05 +   -- Connection (5%)
    -- Engagement bonus: lambda from vote count (up to 4%)
    least(ln(greatest(coalesce(vals.dial_count, 0), 1) + 1) / ln(101), 1.0) * 4
  );

  -- Engagement stats
  declare
    v_total_votes integer;
    v_unique_voters integer;
    v_vote_velocity real;
    v_recent_votes integer;
    v_phase text;
  begin
    select count(*), count(distinct user_id)
    into v_total_votes, v_unique_voters
    from public.dial_reading_history
    where registry_item_id = p_registry_item_id;

    select count(*) into v_recent_votes
    from public.dial_reading_history
    where registry_item_id = p_registry_item_id
      and created_at > now() - interval '1 hour';
    v_vote_velocity := coalesce(v_recent_votes, 0)::real;

    -- Phase: most common phase across 10D dials
    select dc.phase into v_phase
    from public.dial_consensus dc
    join public.dials d on d.id = dc.dial_id
    where dc.registry_item_id = p_registry_item_id
      and d.category = 'universal'
    group by dc.phase
    order by count(*) desc
    limit 1;

    -- Upsert
    insert into public.item_scores (
      registry_item_id,
      score, score_prev, score_delta, score_velocity,
      d_truth, d_quality, d_impact, d_relevance, d_novelty,
      d_universality, d_connection, d_expertise, d_resonance,
      total_votes, unique_voters, vote_velocity,
      kernel_avg, phase,
      first_scored_at, last_scored_at, updated_at
    ) values (
      p_registry_item_id,
      new_score, prev_score, new_score - prev_score, abs(new_score - prev_score),
      vals.truth, vals.quality, vals.impact, vals.relevance, vals.novelty,
      vals.universality, vals.connection, vals.expertise, vals.resonance,
      v_total_votes, v_unique_voters, v_vote_velocity,
      coalesce(vals.avg_kernel, 0.25), coalesce(v_phase, 'nascent'),
      case when prev_score = 0 then now() else null end, now(), now()
    )
    on conflict (registry_item_id)
    do update set
      score = new_score,
      score_prev = prev_score,
      score_delta = new_score - prev_score,
      score_velocity = abs(new_score - prev_score),
      d_truth = vals.truth, d_quality = vals.quality, d_impact = vals.impact,
      d_relevance = vals.relevance, d_novelty = vals.novelty,
      d_universality = vals.universality, d_connection = vals.connection,
      d_expertise = vals.expertise, d_resonance = vals.resonance,
      total_votes = v_total_votes, unique_voters = v_unique_voters,
      vote_velocity = v_vote_velocity,
      kernel_avg = coalesce(vals.avg_kernel, 0.25),
      phase = coalesce(v_phase, 'nascent'),
      last_scored_at = now(), updated_at = now()
    returning * into result;

    return result;
  end;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCTION: Demographic-filtered consensus
-- "What do chefs rate this?" / "What do 25-34 year olds think?"
-- The comb filter.
-- ============================================================
create or replace function public.get_filtered_consensus(
  p_registry_item_id uuid,
  p_dial_id uuid,
  p_facet_type text default null,     -- 'profession', 'age_range', etc.
  p_facet_value text default null     -- 'chef', '25-34', etc.
) returns jsonb as $$
declare
  result jsonb;
begin
  if p_facet_type is null then
    -- No filter: return full consensus
    select jsonb_build_object(
      'avg', round(avg(dr.value)::numeric, 2),
      'stddev', round(coalesce(stddev_pop(dr.value), 0)::numeric, 2),
      'count', count(*),
      'min', min(dr.value),
      'max', max(dr.value),
      'filter', 'everyone'
    ) into result
    from public.dial_readings dr
    where dr.registry_item_id = p_registry_item_id
      and dr.dial_id = p_dial_id;
  else
    -- Demographic filter: only votes from users matching this facet
    select jsonb_build_object(
      'avg', round(coalesce(avg(dr.value), 0)::numeric, 2),
      'stddev', round(coalesce(stddev_pop(dr.value), 0)::numeric, 2),
      'count', count(*),
      'min', min(dr.value),
      'max', max(dr.value),
      'filter', p_facet_type || ':' || p_facet_value
    ) into result
    from public.dial_readings dr
    join public.demographic_facets df on df.user_id = dr.user_id
    where dr.registry_item_id = p_registry_item_id
      and dr.dial_id = p_dial_id
      and df.facet_type = p_facet_type
      and df.facet_value = p_facet_value;
  end if;

  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- FUNCTION: Market view — ranked items by score or dial
-- "Trending food in Oakland" / "Highest truth-rated news"
-- ============================================================
create or replace function public.get_market_rankings(
  p_sort_by text default 'score',        -- 'score', 'truth', 'quality', 'impact', 'velocity', 'kernel'
  p_category text default null,          -- filter by category slug
  p_facet_type text default null,        -- demographic filter
  p_facet_value text default null,
  p_limit integer default 50
) returns table (
  registry_item_id uuid,
  title text,
  thumbnail_url text,
  url text,
  content_type text,
  score real,
  score_delta real,
  vote_velocity real,
  total_votes integer,
  unique_voters integer,
  d_truth real,
  d_quality real,
  d_impact real,
  d_resonance real,
  phase text,
  kernel_avg real,
  category_slug text
) as $$
begin
  return query
  select
    s.registry_item_id,
    ri.title,
    ri.thumbnail_url,
    ri.url,
    ri.content_type,
    s.score,
    s.score_delta,
    s.vote_velocity,
    s.total_votes,
    s.unique_voters,
    s.d_truth,
    s.d_quality,
    s.d_impact,
    s.d_resonance,
    s.phase,
    s.kernel_avg,
    ac.category_slug
  from public.item_scores s
  join public.registry_items ri on ri.id = s.registry_item_id
  left join public.ai_context ac on ac.registry_item_id = s.registry_item_id
  where ri.sharing_level = 'public'
    and (p_category is null or ac.category_slug = p_category)
    -- If demographic filter, only include items that have votes from matching users
    and (p_facet_type is null or exists (
      select 1 from public.dial_readings dr
      join public.demographic_facets df on df.user_id = dr.user_id
      where dr.registry_item_id = s.registry_item_id
        and df.facet_type = p_facet_type
        and df.facet_value = p_facet_value
    ))
  order by
    case p_sort_by
      when 'score' then s.score
      when 'truth' then coalesce(s.d_truth, 0)
      when 'quality' then coalesce(s.d_quality, 0)
      when 'impact' then coalesce(s.d_impact, 0)
      when 'velocity' then s.vote_velocity
      when 'kernel' then s.kernel_avg
      else s.score
    end desc
  limit p_limit;
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- TRIGGER: Auto-recompute item score after cast_dial_vote
-- ============================================================
-- We update cast_dial_vote to also recompute the item score
-- when a universal dial is voted on.

create or replace function public.trigger_recompute_score()
returns trigger as $$
begin
  -- Only recompute if this dial is universal (10D)
  if exists (
    select 1 from public.dials
    where id = NEW.dial_id and category = 'universal'
  ) then
    perform public.recompute_item_score(NEW.registry_item_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_recompute_score
  after insert or update on public.dial_readings
  for each row
  execute function public.trigger_recompute_score();
