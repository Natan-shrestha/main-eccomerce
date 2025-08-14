import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  category_id: string;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const AdminCouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    category_id: '',
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    is_active: true,
    valid_from: '',
    valid_until: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch coupons',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCoupon = async () => {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon created successfully'
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to create coupon',
        variant: 'destructive'
      });
    }
  };

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update(formData)
        .eq('id', selectedCoupon.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon updated successfully'
      });

      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon deleted successfully'
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      category_id: coupon.category_id,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
      valid_from: coupon.valid_from?.split('T')[0] || '',
      valid_until: coupon.valid_until?.split('T')[0] || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      category_id: '',
      min_order_amount: 0,
      max_discount_amount: 0,
      usage_limit: 0,
      is_active: true,
      valid_from: '',
      valid_until: ''
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading coupons...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Coupon Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Coupon</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="20% Off Bedroom Furniture"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get 20% off all bedroom furniture"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed_amount') =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value ({formData.discount_type === 'percentage' ? '%' : '$'})
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">Min Order Amount ($)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_discount_amount">Max Discount ($)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button onClick={handleAddCoupon} className="w-full">
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="font-mono">
                    {coupon.code}
                  </Badge>
                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {coupon.categories && (
                    <Badge variant="outline">{coupon.categories.name}</Badge>
                  )}
                </div>
                <h3 className="font-medium">{coupon.name}</h3>
                <p className="text-sm text-muted-foreground">{coupon.description}</p>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`} off
                  </span>
                  <span>Used: {coupon.used_count}/{coupon.usage_limit || '∞'}</span>
                  {coupon.min_order_amount > 0 && <span>Min: ${coupon.min_order_amount}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(coupon)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCoupon(coupon.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Same form fields as add dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Coupon Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Coupon Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount_type">Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed_amount') =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-discount_value">
                  Discount Value ({formData.discount_type === 'percentage' ? '%' : '$'})
                </Label>
                <Input
                  id="edit-discount_value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category_id">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>

            <Button onClick={handleEditCoupon} className="w-full">
              Update Coupon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminCouponManager;