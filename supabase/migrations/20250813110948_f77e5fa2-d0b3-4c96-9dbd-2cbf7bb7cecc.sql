-- Create coupons table for category-based discounts
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create addresses table for user shipping/billing addresses
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shipping', 'billing')),
  is_default BOOLEAN DEFAULT false,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  
  -- Order totals
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  shipping_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  
  -- Applied coupon
  coupon_id UUID REFERENCES public.coupons(id),
  coupon_code TEXT,
  
  -- Addresses
  shipping_address_id UUID REFERENCES public.addresses(id),
  billing_address_id UUID REFERENCES public.addresses(id),
  
  -- Shipping info
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  product_snapshot JSONB, -- Store product details at time of order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_methods table for tokenized payment info
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'stripe', 'paypal', etc.
  provider_customer_id TEXT, -- Customer ID from payment provider
  payment_method_id TEXT NOT NULL, -- Payment method ID from provider
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  last_four TEXT,
  brand TEXT, -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_transactions table for tracking stock changes
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL, -- negative for decreases, positive for increases
  quantity_after INTEGER NOT NULL,
  reference_type TEXT, -- 'order', 'manual', 'return'
  reference_id UUID, -- order_id, return_id, etc.
  notes TEXT,
  created_by UUID, -- admin user who made the change
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_notifications table for tracking sent emails
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'order_confirmation', 'shipment_update', etc.
  subject TEXT NOT NULL,
  template_name TEXT,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id TEXT, -- External email service ID
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add SKU and additional inventory fields to products
ALTER TABLE public.products 
ADD COLUMN sku TEXT UNIQUE,
ADD COLUMN weight NUMERIC,
ADD COLUMN dimensions JSONB,
ADD COLUMN meta_title TEXT,
ADD COLUMN meta_description TEXT,
ADD COLUMN seo_keywords TEXT[];

-- Enable RLS on all new tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for coupons
CREATE POLICY "Everyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admin managers can manage coupons" 
ON public.coupons 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create RLS policies for addresses
CREATE POLICY "Users can manage their own addresses" 
ON public.addresses 
FOR ALL 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admin viewers can view all addresses" 
ON public.addresses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_viewer'::user_role) OR has_role(auth.uid(), 'admin_manager'::user_role));

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admin viewers can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_viewer'::user_role) OR has_role(auth.uid(), 'admin_manager'::user_role));

CREATE POLICY "Admin managers can manage orders" 
ON public.orders 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create RLS policies for order_items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id::text = auth.uid()::text
));

CREATE POLICY "Admin viewers can view all order items" 
ON public.order_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_viewer'::user_role) OR has_role(auth.uid(), 'admin_manager'::user_role));

CREATE POLICY "Admin managers can manage order items" 
ON public.order_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create RLS policies for payment_methods
CREATE POLICY "Users can manage their own payment methods" 
ON public.payment_methods 
FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Create RLS policies for inventory_transactions
CREATE POLICY "Admin viewers can view inventory transactions" 
ON public.inventory_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_viewer'::user_role) OR has_role(auth.uid(), 'admin_manager'::user_role));

CREATE POLICY "Admin managers can manage inventory transactions" 
ON public.inventory_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create RLS policies for email_notifications
CREATE POLICY "Users can view their own email notifications" 
ON public.email_notifications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admin viewers can view all email notifications" 
ON public.email_notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin_viewer'::user_role) OR has_role(auth.uid(), 'admin_manager'::user_role));

CREATE POLICY "Admin managers can manage email notifications" 
ON public.email_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
BEGIN
  -- Generate order number like ORD-2024-000001
  SELECT 'ORD-' || EXTRACT(YEAR FROM now()) || '-' || 
         LPAD((COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INTEGER), 0) + 1)::TEXT, 6, '0')
  INTO order_num
  FROM public.orders 
  WHERE order_number LIKE 'ORD-' || EXTRACT(YEAR FROM now()) || '-%';
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle inventory changes
CREATE OR REPLACE FUNCTION public.handle_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert inventory transaction record
  INSERT INTO public.inventory_transactions (
    product_id,
    type,
    quantity_change,
    quantity_after,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    NEW.product_id,
    'sale',
    -NEW.quantity,
    (SELECT stock_quantity FROM public.products WHERE id = NEW.product_id) - NEW.quantity,
    'order',
    NEW.order_id,
    'Stock reduced due to order'
  );
  
  -- Update product stock
  UPDATE public.products 
  SET 
    stock_quantity = stock_quantity - NEW.quantity,
    in_stock = CASE WHEN stock_quantity - NEW.quantity > 0 THEN true ELSE false END
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle inventory changes when order items are created
CREATE TRIGGER handle_order_inventory_change
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_change();

-- Create indexes for better performance
CREATE INDEX idx_coupons_category_id ON public.coupons(category_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_products_sku ON public.products(sku);