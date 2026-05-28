-- ============================================================
-- LOCATION SEED DATA — Pokémon Black & White Unova
-- ============================================================
insert into public.locations (name, slug, location_type, order_index, badge_gate, is_optional, is_encounter_area, notes, game, region)
values
  -- PRE-BADGE 1
  ('Nuvema Town (Starter)',  'nuvema-town-starter',    'gift',    1,  null, false, true,  'Starter Pokémon from Prof. Juniper', 'pokemon_black_white', 'unova'),
  ('Route 1',                'route-1',                'route',   2,  null, false, true,  null, 'pokemon_black_white', 'unova'),
  ('Route 2',                'route-2',                'route',   3,  null, false, true,  null, 'pokemon_black_white', 'unova'),
  ('Dreamyard',              'dreamyard',              'building',4,  null, false, true,  'Audino patch + Munna/Musharna static', 'pokemon_black_white', 'unova'),
  ('Route 3',                'route-3',                'route',   5,  1,    false, true,  'Available after Striaton Gym', 'pokemon_black_white', 'unova'),
  ('Wellspring Cave',        'wellspring-cave',        'cave',    6,  1,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Pinwheel Forest (Outer)','pinwheel-forest-outer',  'forest',  7,  1,    false, true,  'Outer section, standard encounters', 'pokemon_black_white', 'unova'),
  ('Pinwheel Forest (Inner)','pinwheel-forest-inner',  'forest',  8,  1,    false, true,  'Inner section — many groups use separate clause', 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 2
  ('Route 4',                'route-4',                'route',   9,  2,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Desert Resort',          'desert-resort',          'desert',  10, 2,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Relic Castle',           'relic-castle',           'cave',    11, 2,    false, true,  'May split from Desert Resort', 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 3
  ('Route 5',                'route-5',                'route',   12, 3,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Driftveil Drawbridge',   'driftveil-drawbridge',   'bridge',  13, 3,    false, true,  'Ducklett swarm on bridge', 'pokemon_black_white', 'unova'),
  ('Cold Storage',           'cold-storage',           'building',14, 3,    false, true,  null, 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 4
  ('Route 6',                'route-6',                'route',   15, 4,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Chargestone Cave',       'chargestone-cave',       'cave',    16, 4,    false, true,  null, 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 5
  ('Route 7',                'route-7',                'route',   17, 5,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Celestial Tower',        'celestial-tower',        'tower',   18, 5,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Mistralton Cave',        'mistralton-cave',        'cave',    19, 5,    false, true,  'Optional area', 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 6
  ('Twist Mountain',         'twist-mountain',         'cave',    20, 6,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Dragonspiral Tower',     'dragonspiral-tower',     'tower',   21, 6,    false, true,  'Floor encounters if house rule enabled', 'pokemon_black_white', 'unova'),
  ('Moor of Icirrus',        'moor-of-icirrus',        'water',   22, 6,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Route 8',                'route-8',                'route',   23, 6,    false, true,  null, 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 7
  ('Tubeline Bridge',        'tubeline-bridge',        'bridge',  24, 7,    false, false, 'No wild encounters', 'pokemon_black_white', 'unova'),
  ('Route 9',                'route-9',                'route',   25, 7,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Shopping Mall Nine',     'shopping-mall-nine',     'building',26, 7,    false, false, 'No wild encounters', 'pokemon_black_white', 'unova'),

  -- PRE-BADGE 8
  ('Route 10',               'route-10',               'route',   27, 8,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Victory Road',           'victory-road',           'cave',    28, 8,    false, true,  null, 'pokemon_black_white', 'unova'),
  ('Pokémon League',         'pokemon-league',         'other',   29, 8,    false, false, 'Elite Four and Champion — no encounters', 'pokemon_black_white', 'unova'),

  -- POST-GAME / OPTIONAL
  ('Route 11',               'route-11',               'route',   30, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Village Bridge',         'village-bridge',         'bridge',  31, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Route 12',               'route-12',               'route',   32, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Lacunosa Town',          'lacunosa-town',          'city',    33, null, true,  false, 'No wild encounters', 'pokemon_black_white', 'unova'),
  ('Route 13',               'route-13',               'route',   34, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Giant Chasm',            'giant-chasm',            'cave',    35, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Undella Town',           'undella-town',           'city',    36, null, true,  false, 'No wild encounters', 'pokemon_black_white', 'unova'),
  ('Undella Bay',            'undella-bay',            'water',   37, null, true,  true,  'Post-game surfing', 'pokemon_black_white', 'unova'),
  ('Route 14',               'route-14',               'route',   38, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Abundant Shrine',        'abundant-shrine',        'other',   39, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Route 15',               'route-15',               'route',   40, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Marvelous Bridge',       'marvelous-bridge',       'bridge',  41, null, true,  false, 'Egg gift only', 'pokemon_black_white', 'unova'),
  ('Black City / White Forest','black-city-white-forest','other', 42, null, true,  true,  'Version exclusive', 'pokemon_black_white', 'unova'),
  ('Route 16',               'route-16',               'route',   43, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Lostlorn Forest',        'lostlorn-forest',        'forest',  44, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Route 17',               'route-17',               'route',   45, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Route 18',               'route-18',               'route',   46, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('P2 Laboratory',          'p2-laboratory',           'building',47, null, true,  false, 'No wild encounters', 'pokemon_black_white', 'unova'),
  ('Challenger''s Cave',     'challengers-cave',       'cave',    48, null, true,  true,  'Post-game', 'pokemon_black_white', 'unova'),
  ('Liberty Garden',         'liberty-garden',          'other',  49, null, true,  true,  'Event/DLC only', 'pokemon_black_white', 'unova')
;

-- ============================================================
-- DEMO RUN (optional — comment out if you want a fresh start)
-- ============================================================

-- Insert a demo run (profiles must be created first via auth)
-- After you sign up, run this to set up the run:
-- insert into public.runs (name, game, region, status)
-- values ('Ototos Linklocke', 'pokemon_black_white', 'unova', 'active');

-- ============================================================
-- DEFAULT RULES (inserted per-run via app, this is the template)
-- ============================================================
-- These will be seeded per-run by the app when a run is created.
-- The app reads from RULES_TEMPLATE in lib/pokemon/rules.ts

-- ============================================================
-- DEFAULT BADGES — Unova Gym Leaders
-- ============================================================
-- Also seeded per-run by the app.
-- badge_number, name, leader, city
-- 1  Trio Badge    Cilan/Chili/Cress  Striaton City
-- 2  Basic Badge   Lenora             Nacrene City
-- 3  Insect Badge  Burgh              Castelia City
-- 4  Bolt Badge    Elesa              Nimbasa City
-- 5  Quake Badge   Clay               Driftveil City
-- 6  Jet Badge     Skyla              Mistralton City
-- 7  Freeze Badge  Brycen             Icirrus City
-- 8  Legend Badge  Iris/Drayden       Opelucid City
