import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products (count)
        `);

      if (error) throw error;
      
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category: any) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          return {
            ...category,
            productCount: count || 0
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Shop by Category</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover our carefully curated furniture collections for every room in your home
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category: any) => (
          <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`}>
            <Card className="group hover:shadow-elegant transition-all duration-300 overflow-hidden bg-card border-border">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={category.image_url || '/placeholder.svg'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <Badge variant="secondary" className="bg-secondary/50">
                  {category.productCount} items
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link 
          to="/products"
          className="inline-block bg-gradient-hero text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
};

export default CategoriesPage;