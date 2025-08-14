import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import CouponManager from "@/components/CouponManager";

// Type for cart item
interface CartItemType {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
  };
  quantity: number;
}

const CartItem = ({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: {
  product: CartItemType["product"];
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}) => {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-6 flex items-center gap-4">
        <Link to={`/product/${product.id}`} className="flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-md hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/product/${product.id}`}
            className="block text-lg font-semibold text-foreground hover:text-primary-glow mb-1 truncate"
          >
            {product.name}
          </Link>
          <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuantityChange(quantity - 1)}
              className="h-8 w-8"
              aria-label={`Decrease quantity of ${product.name}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-semibold">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQuantityChange(quantity + 1)}
              className="h-8 w-8"
              aria-label={`Increase quantity of ${product.name}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-destructive hover:text-destructive h-8 w-8"
            aria-label={`Remove ${product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-right font-bold">
          ${(product.price * quantity).toFixed(2)}
        </div>
      </CardContent>
    </Card>
  );
};

const CartPage = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const { toast } = useToast();

  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const subtotal = totalPrice;
  const shippingCost = subtotal >= 500 ? 0 : 49.99;

  const tax = useMemo(() => Math.max(0, (subtotal - discountAmount) * 0.08), [subtotal, discountAmount]);
  const finalTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount + shippingCost + tax),
    [subtotal, discountAmount, shippingCost, tax]
  );

  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    } else {
      updateQuantity(id, newQty);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeFromCart(id);
    toast({
      title: "Item Removed",
      description: `${name} has been removed from your cart.`,
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const handleCouponApplied = (discount: number, couponCode: string) => {
    setDiscountAmount(Math.min(discount, subtotal));
    setAppliedCoupon(couponCode);
  };

  const handleCouponRemoved = () => {
    setDiscountAmount(0);
    setAppliedCoupon("");
  };

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Looks like you haven’t added anything yet.
        </p>
        <Button asChild size="lg" className="bg-primary hover:bg-primary-glow">
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Items</h2>
              <Button
                variant="ghost"
                onClick={handleClearCart}
                className="text-destructive hover:text-destructive"
              >
                Clear Cart
              </Button>
            </div>

            {items.map(({ product, quantity }) => (
              <CartItem
                key={product.id}
                product={product}
                quantity={quantity}
                onQuantityChange={(newQty) => handleQuantityChange(product.id, newQty)}
                onRemove={() => handleRemoveItem(product.id, product.name)}
              />
            ))}
          </div>

          {/* Coupon and Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            <CouponManager
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              subtotal={subtotal}
            />

            <Card className="sticky top-8 bg-gradient-card border-border/50 shadow-luxury">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>

                {shippingCost > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add ${(500 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>

                <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary-glow"
                      onClick={() => setOpenPaymentModal(true)}
                    >
                      Proceed to Checkout
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Select Payment Method</DialogTitle>
                      <DialogDescription>
                        Choose how you’d like to pay for your order.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Button
                        variant="outline"
                        className="w-full py-6 text-lg"
                        onClick={() => {
                          setOpenPaymentModal(false);
                          toast({
                            title: "Bank QR Payment Selected",
                            description:
                              "You’ll be shown our bank QR to complete payment.",
                          });
                        }}
                      >
                        🏦 Pay via Bank QR
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full py-6 text-lg"
                        onClick={() => {
                          setOpenPaymentModal(false);
                          toast({
                            title: "eSewa/Khalti Payment Selected",
                            description: "Redirecting to eSewa/Khalti payment...",
                          });
                        }}
                      >
                        📱 Pay via eSewa / Khalti
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <p className="text-center text-sm text-muted-foreground">
                  Secure checkout with SSL encryption
                </p>

                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  {["Free returns within 30 days", "5-year warranty included", "Professional assembly available"].map(
                    (feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
