import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, MapPin, CreditCard, Package, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    products: { name: string; image_url: string };
  }>;
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  is_default: boolean;
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

const UserAccountPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    is_default: false,
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      setProfile(profileData);

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name, image_url)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);

      // Fetch addresses
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      setAddresses((addressesData || []) as Address[]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load account data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedProfile: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(updatedProfile);
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleAddAddress = async () => {
    try {
      const { error } = await supabase
        .from('addresses')
        .insert([{ ...addressForm, user_id: user?.id }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address added successfully'
      });

      setIsAddressDialogOpen(false);
      resetAddressForm();
      fetchUserData();
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: 'Error',
        description: 'Failed to add address',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .update(addressForm)
        .eq('id', editingAddress.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address updated successfully'
      });

      setEditingAddress(null);
      resetAddressForm();
      fetchUserData();
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update address',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address deleted successfully'
      });

      fetchUserData();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive'
      });
    }
  };

  const openEditAddressDialog = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      is_default: address.is_default,
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || ''
    });
    setIsAddressDialogOpen(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'shipping',
      is_default: false,
      first_name: '',
      last_name: '',
      company: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      phone: ''
    });
    setEditingAddress(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'shipped': return 'default';
      case 'processing': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                />
              </div>
              <Button onClick={() => handleUpdateProfile(profile)}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{order.order_items?.length || 0} items</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">Your order history will appear here once you make a purchase.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved Addresses</CardTitle>
              <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetAddressForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address_type">Type</Label>
                      <Select
                        value={addressForm.type}
                        onValueChange={(value: 'shipping' | 'billing') =>
                          setAddressForm({ ...addressForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={addressForm.first_name}
                          onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={addressForm.last_name}
                          onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address_line1">Address Line 1</Label>
                      <Input
                        id="address_line1"
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address_line2"
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      />
                    </div>

                    <Button
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      className="w-full"
                    >
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 mb-2">
                            <Badge variant={address.type === 'shipping' ? 'default' : 'secondary'}>
                              {address.type}
                            </Badge>
                            {address.is_default && (
                              <Badge variant="outline">Default</Badge>
                            )}
                          </div>
                          <p className="font-medium">{address.first_name} {address.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          {address.phone && (
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditAddressDialog(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                  <p className="text-muted-foreground">Add your shipping and billing addresses for faster checkout.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payment methods saved</h3>
                <p className="text-muted-foreground">Saved payment methods will appear here after setting up payment processing.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAccountPage;