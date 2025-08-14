import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-furniture.jpg';
import type { Product } from '@/types/product';

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `);

      if (error) throw error;
      
      // Transform the data to match the Product interface
      const transformedProducts = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: null,
        image: product.image_url,
        category: product.categories?.name || 'Uncategorized',
        description: product.description || '',
        inStock: product.in_stock && product.stock_quantity > 0,
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        reviews: Math.floor(Math.random() * 100) + 10, // Random reviews 10-110
        features: []
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products.slice(0, 3);
  const bestSellers = products.filter(p => p.rating >= 4.7).slice(0, 4);

    return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <Badge className="mb-6 px-4 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground font-semibold border border-primary-foreground/40 shadow-sm">
            New Collection Available
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Where Wood and Metal
            <span className="block text-accent-deep">Define Modern Luxury</span>
          </h1>
          
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Where the Warmth of Wood Embraces the Strength of Metal, and Every Piece is a Soulful Expression of Timeless Craftsmanship.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-black hover:bg-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md shadow-md flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 transition-transform transform hover:scale-105 hover:brightness-110 w-full sm:w-auto"
            >
              <Link to="/products" className="flex items-center justify-center w-full">
                Shop Collection
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-primary-foreground text-black hover:bg-primary-100 hover:text-primary-700 rounded-md shadow-sm px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center transition-transform transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500 w-full sm:w-auto mt-3 sm:mt-0"
            >
              <Link to="/about" className="w-full text-center">
                Learn More
              </Link>
            </Button>

          </div>
        </div>
      </section>

      {/* Features */}
     <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {[{
              icon: <Truck className="h-14 w-14 text-indigo-600 mx-auto mb-4" />,
              title: 'Free Delivery',
              description: 'Free shipping on orders over रु 50000. Fast and reliable delivery to your door.'
            }, {
              icon: <Shield className="h-14 w-14 text-indigo-600 mx-auto mb-4" />,
              title: 'Quality Guarantee',
              description: 'Premium materials and craftsmanship. 5-year warranty on all furniture.'
            }, {
              icon: <RotateCcw className="h-14 w-14 text-indigo-600 mx-auto mb-4" />,
              title: 'Easy Returns',
              description: '30-day return policy. Not satisfied? Return for a full refund.'
            }].map(({ icon, title, description }) => (
              <Card
                key={title}
                className="text-center p-8 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="pt-2">
                  {icon}
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">{title}</h3>
                  <p className="text-gray-600 max-w-xs mx-auto">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Featured Products */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Collection</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Handpicked pieces that exemplify our commitment to quality and design excellence.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products available.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="border-primary hover:bg-primary hover:text-primary-foreground">
              <Link to="/products">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    {/* Best Sellers */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 overflow-hidden">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-4xl font-extrabold text-indigo-900 mb-3 relative inline-block">
                  Best Sellers
                  <span className="absolute left-0 -bottom-2 w-24 h-1 rounded-full bg-indigo-600 opacity-70"></span>
                </h2>
                <p className="text-lg text-indigo-700/80 leading-relaxed">
                  Our most loved pieces, trusted by thousands of customers.
                </p>
              </div>

              <div className="hidden md:flex items-center space-x-3 bg-indigo-100 px-4 py-2 rounded-full shadow-md ring-1 ring-indigo-300">
                <Star className="h-6 w-6 text-yellow-400 fill-current animate-pulse" />
                <span className="text-lg font-semibold text-indigo-900 tracking-wide">4.8+ Rating</span>
              </div>
            </div>

            <div className="relative w-full overflow-hidden">
              <div
                className="scroll-container"
                style={{ gap: '2rem' }}
              >
                {/* Duplicate list for seamless loop */}
                {[...bestSellers, ...bestSellers].map((product, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-64 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer mx-4"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inject CSS */}
          <style>{`
            @keyframes scrollLeftToRight {
              0% {
                transform: translateX(-50%);
              }
              100% {
                transform: translateX(0%);
              }
            }
            .scroll-container {
              display: flex;
              width: max-content;
              animation: scrollLeftToRight 30s linear infinite;
            }
          `}</style>
        </section>


      {/* Newsletter */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center max-w-xl">
            <h2 className="text-4xl font-extrabold mb-4">Stay Updated</h2>
            <p className="text-lg mb-10 text-primary-foreground/90 leading-relaxed">
              Get the latest furniture trends and exclusive offers delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-3 rounded-lg bg-primary-foreground text-primary placeholder:text-primary/70 focus:outline-none focus:ring-4 focus:ring-accent-deep transition"
                aria-label="Email address"
              />
              <Button
                type="submit"
                className="bg-accent-deep hover:bg-accent text-accent-foreground px-8 rounded-lg font-semibold transition"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-foreground text-primary px-6 py-10 font-poppins">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0">
            {/* Logo + Text */}
            <div className="flex items-center space-x-6 text-center md:text-left">
              <img
                src="/logo.jpg"
                alt="Brotherwood Interior Nepal Logo"
                className="w-20 h-20 rounded-full border-2 border-black shadow-sm object-cover"
              />
              <div>
                <h3 className="text-3xl font-extrabold mb-3 text-primary">Brotherwood Interior Nepal</h3>
                <p className="max-w-xs text-primary/80 text-lg">
                  Bringing elegance and comfort to your home with premium furniture and exceptional service.
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-4 text-primary/90">
              <h4 className="font-semibold text-xl">Quick Links</h4>
              <nav className="flex flex-col space-y-2 text-lg">
                <a href="/" className="hover:text-accent transition">Home</a>
                <a href="/products" className="hover:text-accent transition">Products</a>
                <a href="/about" className="hover:text-accent transition">About Us</a>
                <a href="/contact" className="hover:text-accent transition">Contact</a>
              </nav>
            </div>

            <div className="text-primary/90 text-center md:text-left text-lg">
              <h4 className="font-semibold text-xl mb-2">Contact Us</h4>
              <p>Phone: +977 9800000000</p>
              <p>Email: info@brotherwoodnepal.com</p>
              <p>Address: Kathmandu, Nepal</p>
            </div>
          </div>

          <div className="mt-10 border-t border-primary/30 pt-6 text-center text-primary/70 text-sm">
            © {new Date().getFullYear()} Brotherwood Interior Nepal. All rights reserved.
          </div>
        </footer>a
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />


    </div>
  );
};

export default HomePage;