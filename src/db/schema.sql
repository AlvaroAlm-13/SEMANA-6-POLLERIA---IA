CREATE TABLE IF NOT EXISTS store_config (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  sku TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  zone_name TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'draft',
  total NUMERIC(10,2) DEFAULT 0,
  delivery_type TEXT DEFAULT 'delivery',
  delivery_zone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO store_config (key, value)
VALUES
  ('store_hours', '{"opening":"11:00","closing":"22:00"}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO products (name, unit_price, sku)
VALUES
  ('pollo entero', 24.00, 'POLLO-ENT'),
  ('papas', 8.00, 'PAPAS-REG'),
  ('gaseosa de litro', 6.00, 'GASEOSA-1L');

INSERT INTO delivery_zones (zone_name, value)
VALUES
  ('Parcona', '{"minutes":35, "cost": 8.00}')
ON CONFLICT (zone_name) DO NOTHING;
