-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  document TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  document TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, or restrict to authenticated users)
CREATE POLICY "Allow authenticated users to read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update customers" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete customers" ON customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update suppliers" ON suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete suppliers" ON suppliers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete products" ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update transactions" ON transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete transactions" ON transactions FOR DELETE TO authenticated USING (true);
