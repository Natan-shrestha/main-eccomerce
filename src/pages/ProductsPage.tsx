import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            category_discounts (
              discount_percentage,
              is_active,
              valid_from,
              valid_until
            )
          )
        `);

      if (error) throw error;

      const transformedProducts = (data || []).map((product: any) => {
        const categoryDiscounts = product.categories?.category_discounts || [];
        const activeDiscount = categoryDiscounts.find((discount: any) =>
          discount.is_active &&
          (!discount.valid_until || new Date(discount.valid_until) >= new Date()) &&
          (!discount.valid_from || new Date(discount.valid_from) <= new Date())
        );

        const originalPrice = product.price;
        const discountedPrice = activeDiscount
          ? originalPrice * (1 - activeDiscount.discount_percentage / 100)
          : originalPrice;

        return {
          id: product.id,
          name: product.name,
          price: discountedPrice,
          originalPrice: activeDiscount ? originalPrice : null,
          image: product.image_url,
          category: product.categories?.name || 'Uncategorized',
          description: product.description || '',
          inStock: product.in_stock && (product.stock_quantity || 0) > 0,
          stockQuantity: product.stock_quantity || 0,
          rating: 4.5,
          reviews: 0,
          features: []
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories([{ id: 'All', name: 'All' }, ...(data || []).map((cat: any) => ({ id: cat.name, name: cat.name }))]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product: any) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((product: any) => product.category === selectedCategory);
    }

    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-500':
          filtered = filtered.filter((product: any) => product.price < 500);
          break;
        case '500-1000':
          filtered = filtered.filter((product: any) => product.price >= 500 && product.price < 1000);
          break;
        case '1000-1500':
          filtered = filtered.filter((product: any) => product.price >= 1000 && product.price < 1500);
          break;
        case 'over-1500':
          filtered = filtered.filter((product: any) => product.price >= 1500);
          break;
      }
    }

    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a: any, b: any) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a: any, b: any) => b.price - a.price);
      case 'newest':
        return filtered.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      default:
        return filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  }, [searchTerm, selectedCategory, sortBy, priceRange, products]);

  const inStockCount = filteredAndSortedProducts.filter((p: any) => p.inStock).length;
  const outOfStockCount = filteredAndSortedProducts.length - inStockCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Products</h1>
          <p className="text-xl text-muted-foreground">
            Discover our complete collection of premium furniture pieces.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 shadow-card mb-8 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-500">Under $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="1000-1500">$1,000 - $1,500</SelectItem>
                <SelectItem value="over-1500">Over $1,500</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedCategory !== 'All' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categories.find((c: any) => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('All')} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Price: {priceRange}
                <button onClick={() => setPriceRange('all')} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-muted-foreground">
            Showing {filteredAndSortedProducts.length} products
            {inStockCount > 0 && (
              <span className="ml-2">
                • <span className="text-green-600">{inStockCount} in stock</span>
                {outOfStockCount > 0 && (
                  <span className="text-muted-foreground"> • {outOfStockCount} out of stock</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {filteredAndSortedProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} className={viewMode === 'list' ? 'flex flex-row' : ''} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setPriceRange('all');
                }}
                variant="outline"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
