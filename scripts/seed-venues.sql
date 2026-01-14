-- Auto-generated venue seed data from Google Places API (cleaned)
-- Generated: 2026-01-11
-- Run with: wrangler d1 execute reviews-db --local --file=scripts/seed-venues.sql

-- Restaurants
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v001', 'Galvin La Chapelle', 'restaurant', '35 Spital Square, London E1 6DY', 'Michelin-starred French restaurant in a stunning former Victorian chapel with impressive arched windows.', 'https://galvinrestaurants.com/michelin-french-restaurant-city-london-galvin-la-chapelle/', 51.5202204, -0.0781198, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v002', 'The Breakfast Club Spitalfields', 'restaurant', '12-16 Artillery Ln, London E1 7LS', 'English and American breakfasts, plus comfort foods and burgers in cheerful, quirky surrounds.', 'http://www.thebreakfastclubcafes.com/', 51.5183691, -0.0788149, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v003', 'Cinnamon Kitchen', 'restaurant', '9 Devonshire Square, London EC2M 4YL', 'Chic contemporary restaurant for innovative Indian cooking influenced by classic British traditions.', 'https://www.cinnamon-kitchen.com/', 51.5173908, -0.0784271, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v004', 'Poppies Fish & Chips', 'restaurant', '6-8 Hanbury St, London E1 6QR', 'Traditional fish-and-chip shop decorated with 1950s memorabilia, offering table service or takeaway.', 'http://www.poppiesfishandchips.co.uk/', 51.5202041, -0.074035, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v005', 'Rosa''s Thai Spitalfields', 'restaurant', '12 Hanbury St, London E1 6QR', 'Modern Thai cuisine served in a compact, light, contemporary wood and whitewashed interior.', 'https://rosasthai.com/', 51.5202563, -0.0738012, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v006', 'London Steakhouse', 'restaurant', '109-117 Middlesex St, London E1 7JF', 'Linen-topped table dining with grills, roasts, fish and English puddings at upscale steakhouse.', 'https://www.londonsteakhousecompany.com/', 51.5175603, -0.0780595, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v007', 'Diwana', 'restaurant', '96 Brick Ln, London E1 6RL', 'A simply laid-out restaurant serving South Indian thalis and dosas, savoury snacks and buffet lunch.', NULL, 51.5195782, -0.0716959, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v008', 'Sheba Restaurant', 'restaurant', '136 Brick Ln, London E1 6RU', 'Award-winning Indian, Bangladeshi and Pakistani curries, grills and tandooris, specialising in lamb shanks.', 'https://www.shebabricklane.com/', 51.5206625, -0.0717127, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v009', 'Aladin Brick Lane', 'restaurant', '132 Brick Ln, London E1 6RU', 'Bangladeshi, Indian and Pakistani curries, baltis and grills in small, bring-your-own restaurant.', 'https://www.aladinbricklane.co.uk/', 51.5205415, -0.0717058, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v010', 'My Old Place', 'restaurant', '88-90 Middlesex St, London E1 7EZ', 'Chinese restaurant serving authentic Szechuan cuisine with wall hangings and traditional decor.', 'https://myoldplace.shop/', 51.5168913, -0.0768672, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v011', 'Cafe Grill', 'restaurant', '35 Brick Ln, London E1 6PU', 'An extensive menu of traditional American fare in a family-friendly setting with outdoor tables.', 'http://www.cafegrillbricklane.co.uk/', 51.5183432, -0.0714527, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v012', 'Devonshire Terrace', 'restaurant', 'Devonshire Square, London EC2M 4WY', 'Sophisticated Modern European restaurant and high glass-roofed courtyard with views of the Gherkin.', 'https://www.drakeandmorgan.co.uk/devonshire-terrace/', 51.5170998, -0.0781852, unixepoch());

-- Cafes
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v013', 'Cafe 1001', 'cafe', '91 Brick Ln, London E1 6QL', 'Bohemian industrial cafe with all-day menu and takeaway snacks, plus evening DJs and live acts.', 'http://www.cafe1001.co.uk/', 51.5209341, -0.0719882, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v014', 'Nude Coffee Roasters', 'cafe', '25 Hanbury St, London E1 6QR', 'Relaxed venue for house-roasted, artisan coffees, plus homemade brunches and sweet treats.', 'http://www.nudeespresso.com/', 51.5204634, -0.0727785, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v015', 'The Market Coffee House', 'cafe', '50-52 Brushfield St, London E1 6AG', 'Snug, dark wood-panelled cafe in a 1600s townhouse serving classic British dishes all day.', 'https://marketcoffeehouseandbar.co.uk/', 51.5190031, -0.076572, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v016', 'MrCoffee&MrsCake', 'cafe', 'Brushfield St, London E1 6EW', 'True Italian coffee experience on the market floor with proper espresso and homemade cakes.', 'https://www.facebook.com/MrCoffeAndMrsCake/', 51.519747, -0.075401, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v017', 'Noxy Brothers', 'cafe', 'Spitalfields Market, 105 Commercial St, London E1 6BG', 'Specialty coffee roasters serving expertly crafted espresso drinks in the heart of the market.', 'https://www.noxybrothers.com/', 51.5194337, -0.0748749, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v018', 'Grind', 'cafe', 'Commercial Street Spitalfields Market, London E1 6EW', 'Stylish coffee bar serving specialty espresso, cocktails and all-day brunch dishes.', 'http://www.grind.co.uk/', 51.5195467, -0.0747165, unixepoch());

-- Bars
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v019', 'All Star Lanes Brick Lane', 'bar', '95 Brick Ln, London E1 6QL', 'Retro-American boutique bowling with burgers, cocktails, karaoke, and a foot-tapping soundtrack.', 'http://www.allstarlanes.co.uk/', 51.5217661, -0.0718479, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v020', 'The Light Bar & Dining', 'bar', '233 Shoreditch High St, London E1 6PJ', 'Converted warehouse with beer garden and roof terrace, Modern European dining and weekend DJs.', 'https://www.lightbarlondon.com/', 51.5221414, -0.07833, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v021', 'The Crown and Shuttle', 'bar', '226 Shoreditch High St, London E1 6PJ', 'Hip bar with exposed brick and junkyard decor, craft beers and a large garden with food truck.', 'http://crownandshuttle.com/', 51.5224951, -0.0781797, unixepoch());

-- Shops
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v022', 'Rough Trade East', 'shop', 'Old Truman Brewery, 91 Brick Ln, London E1 6QL', 'Legendary music emporium in old brewery selling vinyl, books and hosting in-store gigs.', 'http://www.roughtrade.com/', 51.5211024, -0.0724926, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v023', 'Townhouse', 'shop', '5 Fournier St, London E1 6QE', 'Antique shop in an 18th-century house, with furniture, glassware and 20th-century British art.', 'http://www.townhousespitalfields.com/', 51.5193237, -0.0739426, unixepoch());
INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES
('v024', 'London Undercover', 'shop', '20 Hanbury St, London E1 6QR', 'Luxury shop stocking hand-crafted designer umbrellas, plus hats and scarves.', 'https://londonundercover.co.uk/', 51.5202282, -0.0731152, unixepoch());
