-- High-quality venues around White's Row / Spitalfields Market core
-- Generated: 2026-01-11
-- Run with: wrangler d1 execute reviews-db --local --file=scripts/seed-venues-whitesrow-clean.sql

-- ============================================
-- ICONIC / FAMOUS RESTAURANTS
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v061', 'St. JOHN Bread and Wine', 'restaurant', '94-96 Commercial St, London E1 6LZ', 'Rotating menus featuring traditional British nose-to-tail fare and a diverse wine selection.', 'https://stjohnrestaurant.com/a/restaurants/bread-and-wine', 51.5197373, -0.0742167, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v062', 'Ottolenghi Spitalfields', 'restaurant', '50 Artillery Ln, London E1 7LJ', 'Serene destination with a chic vibe offering creative Mediterranean and Middle Eastern cuisine.', 'https://ottolenghi.co.uk/pages/locations/spitalfields', 51.5182265, -0.0771835, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v063', 'Bleecker Burger Spitalfields', 'restaurant', 'Lamb St, London E1 6EA', 'Stylish restaurant serving a compact menu of acclaimed New York-style burgers.', 'https://www.bleecker.co.uk/locations/spitalfields/', 51.5199851, -0.0750328, unixepoch());

-- ============================================
-- LOCAL RESTAURANTS
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v064', 'Merkamo Ethiopian', 'restaurant', 'Horner Square, London E1 6EW', 'Authentic Ethiopian cuisine served in the heart of Spitalfields Market.', 'https://www.facebook.com/merkamo.ethiopian', 51.5197543, -0.0751666, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v065', 'Yum Bun', 'restaurant', 'Unit 3, The Kitchens, 16 Horner Square, London E1 6EW', 'Tiny joint with a few stools for steamed buns stuffed with creative fillings.', 'http://www.yumbun.com/', 51.5196494, -0.0748836, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v066', 'Sud Italia', 'restaurant', '16 Horner Square, London E1 6EW', 'Low-key blue food truck offering wood-fired Neapolitan pizzas in the market.', 'http://www.suditaliapizza.co.uk/', 51.5199388, -0.0754794, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v067', 'Smokoloko', 'restaurant', 'Lamb St, London E1 6ED', 'Food stall known for BBQ meats smoked in a vintage locomotive smoker.', 'http://www.facebook.com/smokolokobbq', 51.520328, -0.0762713, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v068', 'Cafe Caribbean Shoreditch', 'restaurant', 'Brushfield St, London E1 6AA', 'Counter-serve joint dispensing familiar Caribbean plates in the market.', 'https://cafe-caribbean.com/', 51.5198452, -0.0750021, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v069', 'Indi-go Rasoi', 'restaurant', 'Unit 8, The Kitchens, London E1 6EW', 'Indian street food stall in Spitalfields Market.', 'http://www.indigostreetfood.com/', 51.5197482, -0.0751642, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v070', 'Subarashi Sushi', 'restaurant', '14 Brune St, London E1 7NJ', 'Fresh sushi and Japanese dishes near Spitalfields.', NULL, 51.5182341, -0.0748823, unixepoch());

-- ============================================
-- SPECIALTY COFFEE & CAFES
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v071', 'ZeroToOne Coffee', 'cafe', '19 Widegate St, London E1 7HP', 'Specialty coffee roasters serving expertly crafted espresso drinks in a minimalist space.', 'https://zerotoonecoffee.co.uk/', 51.5181603, -0.078206, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v072', 'Nagare Coffee', 'cafe', '40 Brushfield St, London E1 6AG', 'Japanese-inspired specialty coffee shop with precision brewing methods.', 'http://nagare.co.uk/', 51.5189455, -0.0769362, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v073', 'FOAMO Coffee', 'cafe', '69 Commercial St, London E1 6BD', 'Specialty coffee with expertly crafted drinks and light bites.', 'https://foamocoffee.co.uk/', 51.5178602, -0.0742517, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v074', '% ARABICA London', 'cafe', 'Unit 2 Market St, London E1 6AJ', 'Famous Japanese specialty coffee chain known for quality espresso and minimalist aesthetic.', 'http://www.arabicacoffee.uk/', 51.5193851, -0.0772914, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v075', 'JENKI Matcha', 'cafe', '43 Brushfield St, London E1 6AA', 'Specialist matcha cafe serving traditional and creative matcha drinks.', 'http://www.jenki.co.uk/', 51.5192033, -0.0768391, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v076', 'Potter & Reid', 'cafe', '20-22 Toynbee St, London E1 7NE', 'Seasonal breakfast and lunch bites, premium coffee and natural wines.', 'http://potterandreid.com/', 51.5176201, -0.0744934, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v077', 'SUBA Spitalfields', 'cafe', '74 Commercial St, London E1 6LY', 'Artisan bakery serving fresh pastries, bread and coffee.', 'https://www.subabakery.com/', 51.5184134, -0.0741809, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v078', 'Kikki Italian Deli', 'cafe', '13a White''s Row, London E1 7NF', 'Italian deli on White''s Row serving coffee, paninis and imported Italian goods.', 'http://www.kikki.co.uk/', 51.5182827, -0.0746311, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v079', 'The Salad Project', 'cafe', 'London Fruit Exchange, Brushfield St, London E1 6AG', 'Streamlined self-service restaurant offering fresh salads and bowl food.', 'http://www.saladproject.co.uk/', 51.5187712, -0.0754563, unixepoch());

-- ============================================
-- ICONIC PUBS
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v080', 'The Ten Bells', 'bar', '84 Commercial St, London E1 6LY', 'Classic Victorian pub steeped in history, serving craft beers, wine and cocktails.', 'https://www.tenbells.com/', 51.5193521, -0.0742877, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v081', 'The Golden Heart', 'bar', '110 Commercial St, London E1 6LZ', 'Legendary neighbourhood pub and former haunt of the Brit Art pack.', NULL, 51.520155, -0.0742546, unixepoch());

-- ============================================
-- LOCAL BARS & PUBS
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v082', 'Crispin', 'bar', 'White''s Row, London E1 7NF', 'Stylish all-day restaurant, bar and cafe on White''s Row serving natural wines and creative dishes.', 'https://www.crispinlondon.com/', 51.5183098, -0.0760406, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v083', 'The Gun Spitalfields', 'bar', '54 Brushfield St, London E1 6AG', 'Cosmopolitan tavern serving eclectic bar bites and craft brews.', 'https://www.thegunlondon.com/', 51.5188553, -0.0761052, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v084', 'Duke Of Wellington', 'bar', '12 Toynbee St, London E1 7NE', 'Typical neighbourhood boozer with a beer garden offering wines, ales and pub grub.', 'https://www.duke.london/', 51.5179244, -0.0746141, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v085', 'BOTTLES', 'bar', '67 Brushfield St, London E1 6AA', 'Wine bar specialising in natural and organic wines by the glass and bottle.', 'http://www.bottleswine.bar/', 51.5192672, -0.0753087, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v086', '68 & Shanghai', 'bar', '76 Commercial St, London E1 6LY', 'Cocktail bar and Chinese restaurant with creative drinks and dim sum.', 'https://www.68andshanghai.com/', 51.5184791, -0.0741922, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v087', 'Juju''s Bar and Stage', 'bar', '15 Hanbury St, London E1 6QR', 'Innovative cocktails and global bites in art-decorated surroundings with live music.', 'http://jujusbarandstage.com/', 51.5206872, -0.073628, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v088', 'Players Social', 'bar', '1 Crispin Pl, London E1 6DW', 'Rollicking destination featuring pub grub and cocktails, plus pool, darts and arcade games.', 'http://www.players-social.com/', 51.5193405, -0.0761328, unixepoch());

-- ============================================
-- SHOPS
-- ============================================

INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v089', 'Goodhood', 'shop', '15 Hanbury St, London E1 6QR', 'Minimalist, split-level shop for designer streetwear, homeware and lifestyle goods.', 'https://goodhoodstore.com/', 51.5203712, -0.0736169, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v090', 'The Truman Brewery', 'shop', '15 Hanbury St, London E1 6QR', 'Former brewery premises reborn as independent boutiques, bars, galleries and event spaces.', 'http://www.trumanbrewery.com/', 51.5203723, -0.0733297, unixepoch());

