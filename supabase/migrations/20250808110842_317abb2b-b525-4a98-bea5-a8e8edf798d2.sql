-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin_viewer', 'admin_manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin_viewer') OR 
    public.has_role(auth.uid(), 'admin_manager')
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin_viewer') OR 
    public.has_role(auth.uid(), 'admin_manager')
  );

CREATE POLICY "Admin managers can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin_manager'));

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admin managers can manage categories"
  ON public.categories
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin_manager'));

-- RLS Policies for products
CREATE POLICY "Everyone can view products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Admin managers can manage products"
  ON public.products
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin_manager'));

-- Insert default categories
INSERT INTO public.categories (name, description, image_url) VALUES
  ('Living Room', 'Comfortable and stylish furniture for your living space', '/placeholder.svg'),
  ('Bedroom', 'Rest and relaxation furniture for your bedroom', '/placeholder.svg'),
  ('Dining Room', 'Elegant dining furniture for memorable meals', '/placeholder.svg'),
  ('Office', 'Professional and ergonomic office furniture', '/placeholder.svg'),
  ('Storage', 'Smart storage solutions for every room', '/placeholder.svg');

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, category_id, stock_quantity) VALUES
  ('Modern Sectional Sofa', 'Comfortable L-shaped sectional sofa perfect for large living rooms', 1299.99, '/placeholder.svg', (SELECT id FROM public.categories WHERE name = 'Living Room'), 15),
  ('Elegant Dining Table', 'Solid wood dining table that seats up to 8 people', 899.99, '/placeholder.svg', (SELECT id FROM public.categories WHERE name = 'Dining Room'), 8),
  ('Luxury Leather Armchair', 'Premium leather armchair with premium comfort', 699.99, '/placeholder.svg', (SELECT id FROM public.categories WHERE name = 'Living Room'), 12),
  ('Queen Bedroom Set', 'Complete bedroom set including bed frame, nightstands, and dresser', 1599.99, '/placeholder.svg', (SELECT id FROM public.categories WHERE name = 'Bedroom'), 5),
  ('Executive Office Desk', 'Professional office desk with built-in storage', 549.99, '/placeholder.svg', (SELECT id FROM public.categories WHERE name = 'Office'), 20);