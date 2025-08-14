import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Tag, Percent } from 'lucide-react';

interface CouponManagerProps {
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: string;
  subtotal: number;
}

export default function CouponManager({ 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon, 
  subtotal 
}: CouponManagerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a coupon code",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: "The coupon code you entered is not valid or has expired.",
        });
        return;
      }

      // Check if coupon is still valid
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom || (validUntil && now > validUntil)) {
        toast({
          variant: "destructive",
          title: "Coupon Expired",
          description: "This coupon code has expired or is not yet active.",
        });
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast({
          variant: "destructive",
          title: "Coupon Limit Reached",
          description: "This coupon has reached its usage limit.",
        });
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast({
          variant: "destructive",
          title: "Minimum Order Not Met",
          description: `This coupon requires a minimum order of $${coupon.min_order_amount}.`,
        });
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = Math.min(coupon.discount_value, subtotal);
      }

      onCouponApplied(discountAmount, coupon.code);
      setCouponCode('');
      
      toast({
        title: "Coupon Applied!",
        description: `You saved $${discountAmount.toFixed(2)} with coupon ${coupon.code}`,
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved();
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Discount Code
        </CardTitle>
        <CardDescription>
          Enter a coupon code to get a discount on your order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                Coupon "{appliedCoupon}" applied
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={removeCoupon}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="coupon" className="sr-only">Coupon Code</Label>
              <Input
                id="coupon"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
              />
            </div>
            <Button 
              onClick={applyCoupon} 
              disabled={loading || !couponCode.trim()}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>Popular codes: SAVE10, WELCOME20, FURNITURE15</p>
        </div>
      </CardContent>
    </Card>
  );
}