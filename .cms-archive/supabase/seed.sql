-- Sample data. Categories are Al Qaysar's real taxonomy; item prices are
-- PLACEHOLDERS so the site renders before the owner fills the menu in /admin.

insert into restaurants (name, tagline, description, currency, phone, email, address, opening_hours)
select 'Al Qaysar',
       'Authentic Middle Eastern Cuisine & Hospitality',
       'Freshly prepared every day. Halal certified. Serving since 2015.',
       '₱', '', '', '', ''
where not exists (select 1 from restaurants);

insert into categories (name, slug, "group", display_order) values
  ('Appetizer',        'appetizer',        'Food',    10),
  ('Salad & Yogurt',   'salad-yogurt',     'Food',    20),
  ('Soups',            'soups',            'Food',    30),
  ('Grill',            'grill',            'Food',    40),
  ('Grill Chix',       'grill-chix',       'Food',    50),
  ('Main Course',      'main-course',      'Food',    60),
  ('Main Course Stew', 'main-course-stew', 'Food',    70),
  ('Oven Baked',       'oven-baked',       'Food',    80),
  ('Filipino Dish',    'filipino-dish',    'Food',    90),
  ('Bread',            'bread',            'Food',   100),
  ('Pizza & Pide',     'pizza-pide',       'Food',   110),
  ('Pasta',            'pasta',            'Food',   120),
  ('Rice',             'rice',             'Food',   130),
  ('Breakfast',        'breakfast',        'Food',   140),
  ('Sandwich',         'sandwich',         'Food',   150),
  ('Juice',            'juice',            'Drinks', 210),
  ('Shake',            'shake',            'Drinks', 220),
  ('Hot Beverages',    'hot-beverages',    'Drinks', 230),
  ('Coffee',           'coffee',           'Drinks', 240),
  ('Drinks',           'drinks',           'Drinks', 250),
  ('Fruit Platter',    'fruit-platter',    'Dessert',310),
  ('Dessert',          'dessert',          'Dessert',320),
  ('Shisha & Cigarette','shisha-cigarette','Other',  410)
on conflict (slug) do nothing;

-- Sample items --------------------------------------------------------
with new_items as (
  insert into menu_items (category_id, name, slug, description, price, is_best_seller, is_recommended, is_spicy)
  select c.id, v.name, v.slug, v.description, v.price, v.best, v.rec, v.spicy
  from (values
    ('appetizer',    'Hummus',            'hummus',            'Chickpeas blended with tahini, lemon and olive oil.', 180.00, true,  false, false),
    ('appetizer',    'Moutabel',          'moutabel',          'Smoked aubergine with tahini and garlic.',            190.00, false, true,  false),
    ('salad-yogurt', 'Fattoush',          'fattoush',          'Garden vegetables, sumac dressing, toasted bread.',    210.00, false, false, false),
    ('soups',        'Lentil Soup',       'lentil-soup',       'Slow-cooked red lentils with cumin and lemon.',        160.00, false, false, false),
    ('grill',        'Mixed Grill',       'mixed-grill',       'Lamb kofta, shish tawook and beef skewers.',           680.00, true,  true,  false),
    ('grill-chix',   'Shish Tawook',      'shish-tawook',      'Marinated chicken skewers, garlic sauce.',             420.00, true,  false, false),
    ('main-course',  'Chicken Shawarma',  'chicken-shawarma',  'Tender chicken, garlic sauce, pickles, saj bread.',    260.00, true,  true,  false),
    ('main-course-stew','Lamb Stew',      'lamb-stew',         'Slow-cooked lamb with tomato and Middle Eastern spice.',540.00,false, false, false),
    ('oven-baked',   'Lahm Bi Ajeen',     'lahm-bi-ajeen',     'Oven-baked flatbread with spiced minced meat.',        230.00, false, false, true),
    ('bread',        'Saj Bread',         'saj-bread',         'Fresh flatbread baked to order.',                       40.00, false, false, false),
    ('pizza-pide',   'Cheese Pide',       'cheese-pide',       'Turkish flatbread with melted cheese.',                320.00, false, false, false),
    ('rice',         'Chicken Kabsa',     'chicken-kabsa',     'Spiced rice with roasted chicken and nuts.',           480.00, true,  true,  false),
    ('sandwich',     'Beef Shawarma Wrap','beef-shawarma-wrap','Beef shawarma, tahini, pickles in saj bread.',         240.00, true,  false, false),
    ('breakfast',    'Foul Medames',      'foul-medames',      'Fava beans with olive oil, lemon and cumin.',          170.00, false, false, false),
    ('juice',        'Fresh Orange Juice','fresh-orange-juice','Squeezed to order.',                                  140.00, false, false, false),
    ('coffee',       'Turkish Coffee',    'turkish-coffee',    'Finely ground, served traditionally.',                 120.00, false, true,  false),
    ('hot-beverages','Mint Tea',          'mint-tea',          'Fresh mint leaves, lightly sweetened.',                 90.00, false, false, false),
    ('drinks',       'Soft Drink',        'soft-drink',        'Chilled canned soft drink.',                            70.00, false, false, false),
    ('dessert',      'Kunafa',            'kunafa',            'Shredded pastry, sweet cheese, syrup and pistachio.',  260.00, true,  true,  false),
    ('shisha-cigarette','Shisha',         'shisha',            'Assorted flavours. Dine-in only.',                     350.00, false, false, false)
  ) as v(cat_slug, name, slug, description, price, best, rec, spicy)
  join categories c on c.slug = v.cat_slug
  on conflict (slug) do nothing
  returning id, slug
)
-- Everything is available for both menus, except shisha (tables only).
insert into menu_item_availability (menu_item_id, menu_type)
select id, 'TABLES'::menu_type from new_items
union all
select id, 'TAKE_AWAY'::menu_type from new_items where slug <> 'shisha'
on conflict do nothing;
