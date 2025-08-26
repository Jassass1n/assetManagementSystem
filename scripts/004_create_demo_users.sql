-- Create demo users for testing
-- Note: These users will need to be created through the auth system
-- This script creates the profile entries that will be linked to auth users

-- Insert demo profiles (these will be linked when users sign up)
-- The auth.users entries need to be created through the signup process

-- Demo departments if not exists
INSERT INTO public.departments (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Administration', 'Administrative department'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Information Technology', 'IT department managing all technology assets'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Human Resources', 'HR department managing employee relations')
ON CONFLICT (id) DO NOTHING;

-- Note: Demo user profiles will be created automatically when users sign up
-- through the handle_new_user() trigger function

-- Demo asset categories (additional ones)
INSERT INTO public.asset_categories (name, description) VALUES
  ('Software License', 'Software licenses and subscriptions'),
  ('Security Equipment', 'Security cameras, access cards, etc.'),
  ('Furniture', 'Office furniture and equipment')
ON CONFLICT (name) DO NOTHING;

-- Demo assets
INSERT INTO public.assets (
  asset_tag, name, description, category_id, brand, model, serial_number,
  purchase_date, purchase_cost, warranty_expiry, status, location, notes,
  department_id
) VALUES
  (
    'LT001', 'MacBook Pro 16"', 'High-performance laptop for development',
    (SELECT id FROM public.asset_categories WHERE name = 'Laptop' LIMIT 1),
    'Apple', 'MacBook Pro 16" M3', 'MBP16M3001',
    '2024-01-15', 2499.00, '2027-01-15', 'available',
    'IT Storage Room', 'Brand new, ready for assignment',
    (SELECT id FROM public.departments WHERE name = 'Information Technology' LIMIT 1)
  ),
  (
    'DT001', 'iMac 24"', 'All-in-one desktop for design work',
    (SELECT id FROM public.asset_categories WHERE name = 'Desktop' LIMIT 1),
    'Apple', 'iMac 24" M3', 'IMAC24M3001',
    '2024-02-01', 1799.00, '2027-02-01', 'available',
    'Design Department', 'Configured for creative work',
    (SELECT id FROM public.departments WHERE name = 'Information Technology' LIMIT 1)
  ),
  (
    'MON001', 'Dell UltraSharp 27"', 'Professional 4K monitor',
    (SELECT id FROM public.asset_categories WHERE name = 'Monitor' LIMIT 1),
    'Dell', 'U2723QE', 'DLU2723001',
    '2024-01-20', 599.00, '2027-01-20', 'available',
    'IT Storage Room', 'Color-accurate 4K display',
    (SELECT id FROM public.departments WHERE name = 'Information Technology' LIMIT 1)
  ),
  (
    'PRT001', 'HP LaserJet Pro', 'Network laser printer',
    (SELECT id FROM public.asset_categories WHERE name = 'Printer' LIMIT 1),
    'HP', 'LaserJet Pro M404dn', 'HPLJ404001',
    '2023-12-10', 299.00, '2026-12-10', 'assigned',
    'Main Office Floor 2', 'Shared printer for office use',
    (SELECT id FROM public.departments WHERE name = 'Administration' LIMIT 1)
  ),
  (
    'PHN001', 'iPhone 15 Pro', 'Company mobile phone',
    (SELECT id FROM public.asset_categories WHERE name = 'Phone' LIMIT 1),
    'Apple', 'iPhone 15 Pro', 'IPH15P001',
    '2024-03-01', 999.00, '2026-03-01', 'available',
    'IT Storage Room', 'Latest model with advanced features',
    (SELECT id FROM public.departments WHERE name = 'Information Technology' LIMIT 1)
  )
ON CONFLICT (asset_tag) DO NOTHING;
