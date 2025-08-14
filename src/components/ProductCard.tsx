import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { addToCart, items } = useCart();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Quantity already in cart
  const cartItem = items.find(item => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Can we add more?
  const canAddToCart = product.inStock && product.stockQuantity && quantityInCart < product.stockQuantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to add items to the cart.",
        variant: "destructive",
      });
      return;
    }

    if (!product.inStock || !product.stockQuantity) {
      toast({
        title: "Out of Stock",
        description: "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    if (quantityInCart >= product.stockQuantity) {
      toast({
        title: "Maximum quantity reached",
        description: `You already have the maximum available quantity (${product.stockQuantity}) in your cart.`,
        variant: "destructive",
      });
      return;
    }

    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: "Added to Wishlist",
      description: `${product.name} has been added to your wishlist.`,
    });
  };

  const discount = useMemo(() => {
    if (!product.originalPrice) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }, [product.originalPrice, product.price]);

  return (
    <Link to={`/product/${product.id}`}>
      <Card className={`group hover:shadow-luxury transition-all duration-300 overflow-hidden bg-gradient-card border-border/50 ${className}`}>
        <div className="relative overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && <Badge variant="destructive" className="shadow-sm">-{discount}%</Badge>}
            {!product.inStock && <Badge variant="secondary" className="shadow-sm">Out of Stock</Badge>}
            {product.stockQuantity && product.stockQuantity <= 5 && product.inStock && (
              <Badge variant="outline" className="shadow-sm bg-orange-100 text-orange-800 border-orange-200">
                Only {product.stockQuantity} left
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={handleToggleWishlist}
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Quick Add Button */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full ${!canAddToCart ? 'opacity-50 cursor-not-allowed' : 'bg-primary/90 hover:bg-primary'} text-primary-foreground`}
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {!product.inStock ? 'Out of Stock' :
               quantityInCart >= (product.stockQuantity || 0) ? 'Max Quantity Reached' :
               'Add to Cart'}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
            <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary-glow transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.reviews})</span>
            </div>

            {/* Stock Information */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className={product.stockQuantity && product.stockQuantity <= 5 ? 'text-red-500' : ''}>
                {product.inStock ? `${product.stockQuantity || 0} in stock` : 'Out of stock'}
              </span>
              {quantityInCart > 0 && <span className="text-primary">• {quantityInCart} in cart</span>}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary">रु{product.price}</span>
                {product.originalPrice && <span className="text-sm text-muted-foreground line-through">रु{product.originalPrice}</span>}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
