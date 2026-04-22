-- ============================================
-- Lifemax Seed Data — Toronto Area Routes
-- ============================================

-- ============================================
-- Route 1: Toronto Waterfront Walk (Easy)
-- ============================================
INSERT INTO routes (id, name, description, difficulty, bonus_points) VALUES
(1, 'Toronto Waterfront Walk', 'A scenic stroll along Toronto''s beautiful waterfront, from the Harbourfront Centre to the historic Distillery District. Perfect for a relaxed afternoon exploring the city''s lakeside charm.', 'easy', 75);

INSERT INTO stops (route_id, name, description, latitude, longitude, rarity, points, stop_order) VALUES
(1, 'Harbourfront Centre',       'Toronto''s cultural hub on the waterfront with galleries and performance spaces.',  43.6387, -79.3822, 'common',    10, 1),
(1, 'HTO Park',                  'Urban beach park with stunning views of the Toronto Islands and Lake Ontario.',     43.6380, -79.3770, 'common',    10, 2),
(1, 'Sugar Beach',               'A whimsical urban beach with pink umbrellas and white sand by the lake.',           43.6430, -79.3650, 'uncommon',  25, 3),
(1, 'Corus Quay',                'The striking waterfront headquarters of Corus Entertainment with a public pier.',   43.6445, -79.3620, 'common',    10, 4),
(1, 'Distillery District',       'A pedestrian-only village of Victorian-era industrial buildings turned arts hub.',   43.6503, -79.3596, 'rare',      50, 5);

-- Set the polyline for Route 1
UPDATE routes SET polyline = ST_SetSRID(ST_MakeLine(ARRAY[
    ST_MakePoint(-79.3822, 43.6387),
    ST_MakePoint(-79.3770, 43.6380),
    ST_MakePoint(-79.3650, 43.6430),
    ST_MakePoint(-79.3620, 43.6445),
    ST_MakePoint(-79.3596, 43.6503)
]), 4326) WHERE id = 1;

-- ============================================
-- Route 2: Downtown Discovery (Medium)
-- ============================================
INSERT INTO routes (id, name, description, difficulty, bonus_points) VALUES
(2, 'Downtown Discovery', 'Explore Toronto''s vibrant downtown core from the iconic CN Tower through bustling markets and hidden gems. A perfect introduction to the city''s diverse neighborhoods.', 'medium', 100);

INSERT INTO stops (route_id, name, description, latitude, longitude, rarity, points, stop_order) VALUES
(2, 'CN Tower',              'Canada''s most iconic landmark — a 553m communications and observation tower.',      43.6426, -79.3871, 'common',     10, 1),
(2, 'Ripley''s Aquarium',    'A massive aquarium at the base of the CN Tower with underwater tunnel walkways.',    43.6424, -79.3860, 'common',     10, 2),
(2, 'St. Lawrence Market',   'One of the world''s great food markets, operating since 1803.',                      43.6488, -79.3716, 'uncommon',   25, 3),
(2, 'Old City Hall',         'A stunning Romanesque Revival courthouse, now home to provincial courts.',           43.6525, -79.3814, 'uncommon',   25, 4),
(2, 'Nathan Phillips Square','Toronto''s main civic square with the iconic TORONTO sign and reflecting pool.',     43.6526, -79.3832, 'common',     10, 5),
(2, 'AGO (Art Gallery)',     'One of the largest art museums in North America with 95,000+ works.',                43.6536, -79.3925, 'rare',       50, 6),
(2, 'Kensington Market',     'Toronto''s most eclectic neighborhood — a bohemian mix of vintage shops and cafés.', 43.6547, -79.4006, 'legendary', 100, 7);

-- Set the polyline for Route 2
UPDATE routes SET polyline = ST_SetSRID(ST_MakeLine(ARRAY[
    ST_MakePoint(-79.3871, 43.6426),
    ST_MakePoint(-79.3860, 43.6424),
    ST_MakePoint(-79.3716, 43.6488),
    ST_MakePoint(-79.3814, 43.6525),
    ST_MakePoint(-79.3832, 43.6526),
    ST_MakePoint(-79.3925, 43.6536),
    ST_MakePoint(-79.4006, 43.6547)
]), 4326) WHERE id = 2;

-- ============================================
-- Route 3: Royal Parks Trail (Hard)
-- ============================================
INSERT INTO routes (id, name, description, difficulty, bonus_points) VALUES
(3, 'Royal Parks Trail', 'A challenging urban trek connecting Toronto''s greatest green spaces. Wind through High Park''s trails, past the university campus, and into the heart of Queen''s Park. Nature meets city.', 'hard', 150);

INSERT INTO stops (route_id, name, description, latitude, longitude, rarity, points, stop_order) VALUES
(3, 'High Park Entrance',     'Toronto''s largest public park — 400 acres of gardens, trails, and a zoo.',           43.6465, -79.4637, 'common',    10, 1),
(3, 'Grenadier Pond',         'A serene glacial pond within High Park, popular with birdwatchers.',                  43.6420, -79.4680, 'uncommon',  25, 2),
(3, 'Trinity Bellwoods Park', 'A hip neighborhood park beloved by locals, formerly a military garrison.',            43.6472, -79.4140, 'rare',      50, 3),
(3, 'University of Toronto',  'Canada''s top-ranked university with stunning Gothic Revival architecture.',          43.6629, -79.3957, 'uncommon',  25, 4),
(3, 'Royal Ontario Museum',   'Canada''s largest museum of natural history and world cultures.',                     43.6677, -79.3948, 'legendary', 100, 5),
(3, 'Queen''s Park',          'The seat of the Ontario Legislature, surrounded by a beautiful oval park.',           43.6604, -79.3920, 'rare',      50, 6);

-- Set the polyline for Route 3
UPDATE routes SET polyline = ST_SetSRID(ST_MakeLine(ARRAY[
    ST_MakePoint(-79.4637, 43.6465),
    ST_MakePoint(-79.4680, 43.6420),
    ST_MakePoint(-79.4140, 43.6472),
    ST_MakePoint(-79.3957, 43.6629),
    ST_MakePoint(-79.3948, 43.6677),
    ST_MakePoint(-79.3920, 43.6604)
]), 4326) WHERE id = 3;

-- Reset sequences
SELECT setval('routes_id_seq', (SELECT MAX(id) FROM routes));
SELECT setval('stops_id_seq', (SELECT MAX(id) FROM stops));
