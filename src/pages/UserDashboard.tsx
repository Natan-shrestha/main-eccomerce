import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, User, MapPin, CreditCard } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Address {
  id: string;
  user_id: string;
  type: string;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState([]);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    type: 'shipping',
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
      }

      // Fetch addresses
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (addressData) {
        setAddresses(addressData);
      }

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (orderData) {
        setOrders(orderData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      fetchUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .insert([{ ...addressForm, user_id: user.id }]);

      if (error) throw error;

      toast({
        title: "Address added",
        description: "Your address has been added successfully.",
      });
      
      setAddressForm({
        type: 'shipping',
        first_name: '',
        last_name: '',
        company: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
        is_default: false
      });
      
      fetchUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Manage your account and view your orders</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Address</CardTitle>
                <CardDescription>Add a shipping or billing address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={addAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Address Type</Label>
                      <Select value={addressForm.type} onValueChange={(value) => setAddressForm(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={addressForm.first_name}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={addressForm.last_name}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        value={addressForm.company}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address_line1">Address Line 1</Label>
                      <Input
                        id="address_line1"
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address_line2"
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Address"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{address.type} Address</span>
                      {address.is_default && (
                        <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="font-medium">{address.first_name} {address.last_name}</p>
                      {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
                      <p className="text-sm">{address.address_line1}</p>
                      {address.address_line2 && <p className="text-sm">{address.address_line2}</p>}
                      <p className="text-sm">{address.city}, {address.state} {address.postal_code}</p>
                      {address.phone && <p className="text-sm">{address.phone}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View your past orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Button 
                    onClick={() => navigate('/products')}
                    className="mt-4"
                  >
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium">Order #{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${order.total_amount}</p>
                            <span className={`text-sm px-2 py-1 rounded ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-3">
                              <img 
                                src={item.products?.image_url || '/placeholder.svg'} 
                                alt={item.products?.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.products?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × ${item.unit_price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Payment methods will be available soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature is under development
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}