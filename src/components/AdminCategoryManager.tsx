import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Folder, Percent, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  discount_percentage?: number;
}

interface CategoryDiscount {
  id: string;
  category_id: string;
  discount_percentage: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  categories?: { name: string };
}

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryForDiscount, setSelectedCategoryForDiscount] = useState<string>('');
  const { toast } = useToast();

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [discountForm, setDiscountForm] = useState({
    discount_percentage: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
    fetchDiscounts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('category_discounts')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts((data || []) as CategoryDiscount[]);
    } catch (error: any) {
      console.error('Error fetching discounts:', error);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `category-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setCategoryForm({ name: '', description: '', image_url: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = categoryForm.image_url;

      // Upload new image if one was selected
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null,
            image_url: imageUrl || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Category updated",
          description: "The category has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: categoryForm.name,
            description: categoryForm.description || null,
            image_url: imageUrl || null,
          }]);

        if (error) throw error;

        toast({
          title: "Category created",
          description: "The new category has been created successfully.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    // Set preview to existing image
    setImagePreview(category.image_url);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleAddDiscount = () => {
    setDiscountForm({
      discount_percentage: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true
    });
    setSelectedCategoryForDiscount('');
    setIsDiscountDialogOpen(true);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('category_discounts')
        .insert([{
          category_id: selectedCategoryForDiscount,
          discount_percentage: parseFloat(discountForm.discount_percentage),
          valid_from: discountForm.valid_from,
          valid_until: discountForm.valid_until || null,
          is_active: discountForm.is_active
        }]);

      if (error) throw error;

      toast({
        title: "Discount created",
        description: "The category discount has been created successfully.",
      });

      setIsDiscountDialogOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">Manage product categories and category-specific discounts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleAddDiscount}>
                <Percent className="h-4 w-4 mr-2" />
                Add Category Discount
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category Discount</DialogTitle>
                <DialogDescription>
                  Create a discount that applies to all products in a specific category
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDiscountSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategoryForDiscount} onValueChange={setSelectedCategoryForDiscount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_percentage">Discount Percentage</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Enter discount percentage"
                      value={discountForm.discount_percentage}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={discountForm.valid_from}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, valid_from: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_until">Valid Until (Optional)</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={discountForm.valid_until}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, valid_until: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Discount
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update the category details.' : 'Create a new product category.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter category name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter category description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Category Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="w-32 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Categories
          </CardTitle>
          <CardDescription>
            Manage your product categories and organize your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No categories found</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first category to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {category.description ? (
                        <span className="text-sm">{category.description}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Category Discounts
            </CardTitle>
            <CardDescription>
              Active discounts applied to product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">
                      {categories.find(c => c.id === discount.category_id)?.name}
                    </TableCell>
                    <TableCell>{discount.discount_percentage}%</TableCell>
                    <TableCell>{new Date(discount.valid_from).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {discount.valid_until 
                        ? new Date(discount.valid_until).toLocaleDateString()
                        : 'No expiry'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.is_active ? "default" : "secondary"}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}