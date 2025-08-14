import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductAndRelated(id);
      fetchReviews(id);
    }
  }, [id]);

  const fetchProductAndRelated = async (productId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, categories(name)`)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);

      if (data?.category_id) {
        const { data: related, error: relatedError } = await supabase
          .from('products')
          .select(`*, categories(name)`)
          .eq('category_id', data.category_id)
          .neq('id', productId)
          .limit(4);

        if (!relatedError) setRelatedProducts(related || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId: string) => {
    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.svg';
    return path.startsWith('http')
      ? path
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (quantity > product.stock_quantity) {
      toast({
        title: 'Not enough stock',
        description: `Only ${product.stock_quantity} available.`,
        variant: 'destructive',
      });
      return;
    }

    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.image_url),
      category: product.categories?.name || '',
      description: product.description,
      inStock: product.stock_quantity > 0,
      rating: 5,
      reviews: reviews.length,
      features: [],
    };

    addToCart(cartProduct, quantity);
    toast({
      title: 'Added to cart',
      description: `${quantity} × ${product.name} added to your cart.`,
    });
  };

  const handleReviewSubmit = async () => {
    if (!newComment.trim()) {
      toast({ title: 'Please write a comment', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any)
      .from('reviews')
      .insert([{ product_id: id, rating: newRating, comment: newComment }]);

    setSubmitting(false);

    if (error) {
      console.error('Error adding review:', error);
      toast({ title: 'Error adding review', variant: 'destructive' });
    } else {
      toast({ title: 'Review added successfully' });
      setNewComment('');
      setNewRating(5);
      setShowForm(false);
      fetchReviews(id!);
    }
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // index 0 → 5★, index 4 → 1★
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[5 - r.rating] += 1;
      }
    });
    return distribution;
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (!product) return <div className="container mx-auto p-4">Product not found.</div>;

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="container mx-auto p-4">
      {/* Product Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative group">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded">
              -{discount}% OFF
            </div>
          )}
          {product.stock_quantity <= 0 && (
            <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 text-sm rounded">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="sticky top-8 self-start space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-gray-500">
            Category: {product.categories?.name || 'Uncategorized'}
          </p>
          <p className="text-2xl font-bold text-red-600">${product.price?.toFixed(2)}</p>
          {product.original_price && (
            <p className="line-through text-gray-400">${product.original_price?.toFixed(2)}</p>
          )}
          <p className="text-gray-700">{product.description}</p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              variant="outline"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              min="1"
              max={Math.min(10, product.stock_quantity)}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="w-16 text-center border rounded"
            />
            <Button
              size="icon"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              variant="outline"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg flex items-center justify-center"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.stock_quantity > 0
              ? `Add to Cart - $${(product.price * quantity).toFixed(2)}`
              : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {/* ---- REVIEW SECTION (unchanged) ---- */}
      <div className="mt-16">
        {/* Rating Summary */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-4xl font-bold text-gray-800">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
            </span>
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i <
                    Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-500 text-lg">Over {reviews.length} Reviews</span>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-lg shadow"
          >
            ✏️ Write a Review
          </Button>
        </div>

        {/* Rating Distribution Progress Bars */}
        {reviews.length > 0 && (
          <div className="mb-8 space-y-2">
            {getRatingDistribution().map((count, index) => {
              const total = reviews.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="w-12 text-sm font-medium">{5 - index} ★</span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm text-gray-600">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="mb-10 bg-gray-50 p-6 rounded-lg shadow-lg border">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Write a Review</h3>

            <label className="block mb-2 font-medium">Rating</label>
            <div className="flex mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  onClick={() => setNewRating(i + 1)}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    i < newRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                />
              ))}
            </div>

            <label className="block mb-2 font-medium">Comment</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full border p-2 rounded mb-4"
            />
            <Button
              onClick={handleReviewSubmit}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex space-x-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="min-w-[300px] max-w-[320px] bg-white shadow-md rounded-xl p-5 border hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        rev.username || 'User'
                      )}&background=random&color=fff`}
                      alt="avatar"
                      className="w-12 h-12 rounded-full mr-3 border"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{rev.username || 'Anonymous'}</p>
                      <span className="text-xs text-gray-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <Card key={rp.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <Link to={`/products/${rp.id}`} className="block group">
                    <img
                      src={getImageUrl(rp.image_url)}
                      alt={rp.name}
                      className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <h3 className="mt-2 font-semibold">{rp.name}</h3>
                    <p className="text-sm text-muted-foreground">${rp.price?.toFixed(2)}</p>
                  </Link>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => addToCart(rp)}
                    className="w-full"
                    disabled={rp.stock_quantity <= 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {rp.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
