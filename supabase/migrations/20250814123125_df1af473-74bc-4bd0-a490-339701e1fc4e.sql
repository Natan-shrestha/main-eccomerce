-- Create category_discounts table with proper structure
CREATE TABLE IF NOT EXISTS public.category_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for category_discounts
CREATE POLICY "Everyone can view active category discounts" 
ON public.category_discounts 
FOR SELECT 
USING (is_active = true AND (valid_until IS NULL OR valid_until >= CURRENT_DATE));

CREATE POLICY "Admin managers can manage category discounts" 
ON public.category_discounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin_manager'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin_manager'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_category_discounts_updated_at
  BEFORE UPDATE ON public.category_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();