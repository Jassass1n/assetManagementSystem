-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('IT', 'Information Technology Department'),
  ('HR', 'Human Resources Department'),
  ('Finance', 'Finance Department'),
  ('Marketing', 'Marketing Department'),
  ('Operations', 'Operations Department'),
  ('Sales', 'Sales Department')
ON CONFLICT (name) DO NOTHING;

-- Insert default asset categories
INSERT INTO public.asset_categories (name, description) VALUES
  ('Laptop', 'Portable computers for mobile work'),
  ('Desktop', 'Desktop computers for office work'),
  ('Monitor', 'Display screens and monitors'),
  ('Printer', 'Printing devices and equipment'),
  ('Phone', 'Mobile phones and desk phones'),
  ('Tablet', 'Tablet devices and iPads'),
  ('Keyboard', 'Computer keyboards'),
  ('Mouse', 'Computer mice and pointing devices'),
  ('Headset', 'Audio headsets and headphones'),
  ('Webcam', 'Web cameras for video conferencing'),
  ('Docking Station', 'Laptop docking stations'),
  ('Server', 'Server hardware'),
  ('Network Equipment', 'Routers, switches, and network devices'),
  ('Storage', 'External drives and storage devices'),
  ('Other', 'Other IT equipment')
ON CONFLICT (name) DO NOTHING;
