CREATE TABLE IF NOT EXISTS gold_rates (
  id SERIAL PRIMARY KEY,
  gold_24k_sale NUMERIC(10,2) NOT NULL,
  gold_24k_purchase NUMERIC(10,2) NOT NULL,
  gold_22k_sale NUMERIC(10,2) NOT NULL,
  gold_22k_purchase NUMERIC(10,2) NOT NULL,
  gold_18k_sale NUMERIC(10,2) NOT NULL,
  gold_18k_purchase NUMERIC(10,2) NOT NULL,
  silver_per_kg_sale NUMERIC(10,2) NOT NULL,
  silver_per_kg_purchase NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS display_settings (
  id SERIAL PRIMARY KEY,
  orientation TEXT DEFAULT 'horizontal',
  background_color TEXT DEFAULT '#FFF8E1',
  text_color TEXT DEFAULT '#212529',
  rate_number_font_size TEXT DEFAULT 'text-4xl',
  show_media BOOLEAN DEFAULT TRUE,
  rates_display_duration INTEGER DEFAULT 15,
  refresh_interval INTEGER DEFAULT 30,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  file_size BIGINT,
  mime_type TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_images (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 5,
  transition_effect TEXT DEFAULT 'fade',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  file_size BIGINT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banner_settings (
  id SERIAL PRIMARY KEY,
  banner_image_url TEXT,
  banner_height INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
