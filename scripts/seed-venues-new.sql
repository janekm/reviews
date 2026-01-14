-- Additional venue seed data from Google Places API (cleaned)
-- Generated: 2026-01-11
-- Areas: Artillery Lane, Liverpool Street, Aldgate, Whitechapel
-- Run with: wrangler d1 execute reviews-db --local --file=scripts/seed-venues-new.sql

-- ============================================
-- ARTILLERY LANE / LIVERPOOL STREET AREA
-- ============================================

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

-- ============================================
-- ALDGATE / WHITECHAPEL AREA
-- ============================================

-- Restaurants
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v040', 'Thai Square Minories', 'restaurant', '136-138 Minories, London EC3N 1NT', 'Contemporary Thai restaurant with bronze Buddhist sculptures and traditional carvings.', 'https://thaisq.com/restaurants/minories/', 51.5123418, -0.0756214, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v041', 'Halal Restaurant', 'restaurant', '2 St Mark St, London E1 8DJ', 'Timeless Indian restaurant with simple menu, in the same home since it was established before WWII.', 'http://www.halalrest.co.uk/', 51.5134536, -0.0715783, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v042', 'The Empress', 'restaurant', '141 Leman St, London E1 8EY', 'Traditional Indian and Bangladeshi food in a spotlit room with wooden floors and white tablecloths.', 'http://www.theempress.co.uk/', 51.5113339, -0.0685036, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v043', 'Oummi Lebanese', 'restaurant', '133 Leman St, London E1 8EY', 'Lebanese meze and chargrilled meat dishes in a small, simply furnished restaurant with takeaway.', 'http://www.bonappetitlebanese.com/', 51.5115822, -0.0686907, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v044', 'Satyrio', 'restaurant', '49 Aldgate High St, London EC3N 1AL', 'Chill trattoria offering pastas, Italian cheese and charcuterie menus, plus an extensive wine list.', 'https://www.satyrio.co.uk/', 51.5142521, -0.0742536, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v045', 'Pizza Union Aldgate', 'restaurant', '29 Leman St, London E1 8PT', 'Industrial-style pizzeria serving gourmet thin-crust pizzas fire-baked in under 3 minutes.', 'https://www.pizzaunion.com/', 51.5139055, -0.0703050, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v046', 'Pilpel', 'restaurant', '60 Alie St, Aldgate, London E1 8PX', 'Middle Eastern fast food featuring falafel and hummus to take away or eat in a casual setting.', 'http://www.pilpel.co.uk/', 51.5140748, -0.0700945, unixepoch());

-- Bars
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v047', 'The Chamberlain', 'bar', '132-135 Minories, London EC3N 1NU', 'Victorian-era pub with a Modern British menu and cosy, stylish interior near Tower Hill.', 'https://www.thechamberlainhotel.co.uk/', 51.5122297, -0.0756757, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v048', 'The Corner London City', 'bar', '42 Adler St, London E1 1EE', 'Trendy hotel bar with a living room-style lobby serving craft cocktails and local fare.', 'https://www.thecornerlondoncity.co.uk/', 51.5161942, -0.0676868, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v049', 'The White Hart', 'bar', '89 Whitechapel High St, London E1 7RA', 'Traditional watering hole offering Thai and English food with live TV sports.', 'http://www.thewhitehartlondon.co.uk/', 51.515843, -0.0708425, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v050', 'The Black Horse', 'bar', '40 Leman St, London E1 8EU', 'Classic East End pub with rotating craft beers and a friendly local atmosphere.', 'https://blackhorselondoncouk.simplybook.it/', 51.5137627, -0.0707595, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v051', 'Treves & Hyde', 'bar', '15-17 Leman St, London E1 8EN', 'Continental-inspired dishes in a modern setting with outdoor tables and classic cocktails.', NULL, 51.5147643, -0.0706437, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v052', 'Curzon Aldgate', 'bar', '2 Canter Way, London E1 8PS', 'Independent cinema with a stylish bar serving craft beers, wines and cocktails.', 'https://www.curzon.com/venues/aldgate/', 51.5137742, -0.0690075, unixepoch());

-- Cafes
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v053', 'Dulce Coffee', 'cafe', '86 Whitechapel High St, London E1 7QX', 'Classic coffee shop with assorted sandwiches and baked goods, featuring outdoor tables.', 'http://www.dulcecoffeeandkitchen.com/', 51.5159021, -0.0705461, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v054', 'De Vine', 'cafe', '19 Vine St, America Square, London EC3N 2PX', 'Counter-serve cafe and deli serving informal breakfast and lunch under the railway bridge.', NULL, 51.5110165, -0.0756282, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v055', 'Exmouth Coffee Company', 'cafe', '83 Whitechapel High St, London E1 7QX', 'Buzzy cafe with coffee roasted on-site and homemade cakes, salads and quiches.', NULL, 51.5160059, -0.0703758, unixepoch());

-- ============================================
-- SHOREDITCH HIGH STREET AREA
-- ============================================

-- Restaurants
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v056', 'Pizza East Shoreditch', 'restaurant', '56 Shoreditch High St, London E1 6JJ', 'Industrial-chic pizzeria serving rustic pizza, antipasti and creative small plates.', 'https://www.pizzaeast.com/shoreditch', 51.5238052, -0.0769164, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v057', 'Dishoom Shoreditch', 'restaurant', '7 Boundary St, London E2 7JE', 'Buzzy destination for Indian street food in Bombay-style digs with vintage ceiling fans.', 'https://www.dishoom.com/shoreditch', 51.5245002, -0.0765998, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v058', 'Smoking Goat Shoreditch', 'restaurant', '64 Shoreditch High St, London E1 6JJ', 'Cool, laid-back restaurant serving quirky Thai-inspired dishes and creative cocktails.', 'http://www.smokinggoatbar.com/', 51.524224, -0.0769238, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v059', 'Boundary Restaurant', 'restaurant', '2-4 Boundary St, London E2 7DD', 'Upscale rooftop restaurant in a converted warehouse with seasonal British and French cuisine.', 'https://boundary.london/', 51.524475, -0.0762987, unixepoch());

-- Bars
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v060', 'Owl & Pussycat', 'bar', '34 Redchurch St, London E2 7DP', 'Bustling traditional pub with a small outside terrace and classic pub grub.', 'https://www.owlandpussycatshoreditch.com/', 51.5242966, -0.0754871, unixepoch());

