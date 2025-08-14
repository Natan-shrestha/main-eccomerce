-- Fix function search paths for security
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO '';

-- Fix function search path for inventory handling
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO '';

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
CREATE POLICY "Everyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for their own orders" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admin managers can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role));