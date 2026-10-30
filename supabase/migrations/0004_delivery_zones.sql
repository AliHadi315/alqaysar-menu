-- Delivery sells the take-away price list; only the fee and the address differ,
-- so there is no third menu_type. What varies is the area being driven to.
--
-- Seeded with the three areas the restaurant covers and starting fees. These
-- are a starting point, not the restaurant's own numbers: the owner adjusts
-- them in Settings. A zone with a fee of 0 still appears in
-- the picker (it tells the driver where to go) but adds nothing to the total.
alter table restaurants
  add column if not exists delivery_zones jsonb not null default
    '[{"name":"Dahye","name_ar":"الضاحية","fee":4},
      {"name":"Beirut","name_ar":"بيروت","fee":5},
      {"name":"Mount Lebanon","name_ar":"جبل لبنان","fee":7}]'::jsonb;
