-- Auto-generated venue seed data from Google Places API (cleaned)
-- Generated: 2026-01-11
-- Area: Artillery Lane / Liverpool Street (south-west of Spitalfields Market)
-- Run with: wrangler d1 execute reviews-db --local --file=scripts/seed-venues-artillery.sql

-- Restaurants
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v025', 'SUSHISAMBA London', 'restaurant', 'Heron Tower, 110 Bishopsgate, London EC2N 4AY', 'Creative Japanese, Brazilian & Peruvian cuisine in a stunning 38th-floor setting with panoramic views.', 'https://www.sushisamba.com/locations/uk/london-heron-tower', 51.5162529, -0.0809449, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v026', 'Duck & Waffle', 'restaurant', '110 Bishopsgate, London EC2N 4AY', 'British & European cuisine 24/7 in a modern 40th-floor space with floor-to-ceiling windows.', 'https://duckandwaffle.com/london/', 51.5162529, -0.0811942, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v027', 'Miyako', 'restaurant', '40 Liverpool St, London EC2M 7QN', 'Smart space with dark wood tables, delivering sushi, sashimi and teriyaki to eat in or take away.', 'https://www.hyattrestaurants.com/en/london/restaurant/miyako-london', 51.5171518, -0.0812353, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v028', 'So Restaurant', 'restaurant', '5 Middlesex St, London E1 7AA', 'Sushi and modern Japanese cuisine with European touches in a contemporary room with neutral tones.', 'http://www.sorestaurant.com/', 51.5156641, -0.0756868, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v029', 'Fora Restaurant', 'restaurant', '34-36 Houndsditch, London EC3A 7DB', 'Traditional Mediterranean cuisine, mainly Turkish, served in an elegant contemporary space.', 'http://www.forarestaurants.co.uk/', 51.5148695, -0.0780994, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v030', 'Barcelona Tapas Bar & Restaurant', 'restaurant', '1 Middlesex Street, London E1 7AA', 'Colourful Spanish restaurant with mosaics and original art, serving authentic tapas and paella.', 'http://www.barcelona-tapas.com/', 51.5154196, -0.0755005, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v031', 'Pizza Union Spitalfields', 'restaurant', '25 Sandy''s Row, London E1 7HS', 'Communal wood tables line this industrial-style canteen for gourmet pizzas fire baked in 3 minutes.', 'https://www.pizzaunion.com/', 51.5177254, -0.0772571, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v032', 'HAZ Premier Place', 'restaurant', '9 Cutler St, London E1 7DJ', 'Modern, wood-panelled cafe-bistro offering mezze, kebabs and casseroles at canteen-style tables.', 'https://www.hazrestaurant.co.uk/', 51.5158333, -0.0788889, unixepoch());

-- Bars
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v033', 'The Drift', 'bar', '110 Bishopsgate, London EC2N 4AY', 'Designer, glass-wrapped cocktail bar and restaurant with eclectic decor, popular with city workers.', 'https://www.drakeandmorgan.co.uk/the-drift/', 51.5163236, -0.0808879, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v034', 'The Railway Tavern', 'bar', '15 Liverpool St, London EC2M 7NX', 'Traditional pub with flower baskets and outdoor seats, close to the station and popular with locals.', 'https://www.greeneking.co.uk/pubs/greater-london/railway', 51.5175283, -0.0834172, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v035', 'Dirty Martini Bishopsgate', 'bar', '158 Bishopsgate, London EC2M 4LN', 'Stylish downstairs cocktail bar specialising in creative Martinis with space for private hire.', 'https://www.dirtymartini.uk.com/bars/bishopsgate', 51.5171401, -0.0805224, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v036', 'Williams Ale & Cider House', 'bar', '22-24 Artillery Ln, London E1 7LS', 'Cosy traditional pub on Artillery Lane specialising in craft ales and artisan ciders.', 'https://www.williamsspitalfields.com/', 51.5183958, -0.0784967, unixepoch());

-- Cafes
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v037', 'Polo Bar', 'cafe', '176 Bishopsgate, London EC2M 4NQ', 'Laid-back British cafe open 24 hours for breakfast, brunch, lunch and dinner, plus desserts.', 'https://polobar.co.uk/', 51.5176007, -0.0801563, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v038', 'Rake''s Café Bar', 'cafe', '40 Liverpool St, London EC2M 7QN', 'Lofty cafe and lounge with old-world moulding and plush seating for cocktails, coffee and comfort fare.', 'https://www.hyattrestaurants.com/en/london/restaurant-bar/rakes-cafe-bar', 51.5174377, -0.0807942, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v039', 'Chaplins Deli', 'cafe', '10 Bevis Marks, London EC3A 7LH', 'Local deli serving fresh sandwiches, salads and hot dishes to the City lunch crowd.', NULL, 51.5146531, -0.0788018, unixepoch());

