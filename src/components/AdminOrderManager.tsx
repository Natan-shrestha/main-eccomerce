import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, RefreshCw, Truck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  coupon_code?: string;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  profiles?: { full_name: string; email: string };
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: { name: string; image_url: string };
  }>;
}

const AdminOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editForm, setEditForm] = useState({
    status: '',
    tracking_number: '',
    carrier: '',
    admin_notes: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey (full_name, email),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders((data || []) as any);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updateData: any = { status: newStatus };

      // Set timestamp based on status
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const handleEditOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update(editForm)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order updated successfully'
      });

      setIsEditDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      admin_notes: order.admin_notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'secondary';
      case 'partially_refunded': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading orders...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Management</CardTitle>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.profiles?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{order.profiles?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  {format(new Date(order.created_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(order)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {order.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                      >
                        <Truck className="w-4 h-4" />
                      </Button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'refunded' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p>{selectedOrder.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.profiles?.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Status</h3>
                  <div className="flex gap-2">
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                    <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.payment_status)}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.products.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>${item.total_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shipping_amount.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({selectedOrder.coupon_code}):</span>
                        <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total:</span>
                      <span>${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  {selectedOrder.tracking_number ? (
                    <div className="space-y-1 text-sm">
                      <div>Carrier: {selectedOrder.carrier}</div>
                      <div>Tracking: {selectedOrder.tracking_number}</div>
                      {selectedOrder.shipped_at && (
                        <div>Shipped: {format(new Date(selectedOrder.shipped_at), 'MMM dd, yyyy')}</div>
                      )}
                      {selectedOrder.delivered_at && (
                        <div>Delivered: {format(new Date(selectedOrder.delivered_at), 'MMM dd, yyyy')}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tracking information available</p>
                  )}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Customer Notes</h3>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.admin_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <p className="text-sm">{selectedOrder.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={editForm.carrier}
                onChange={(e) => setEditForm({ ...editForm, carrier: e.target.value })}
                placeholder="UPS, FedEx, USPS, etc."
              />
            </div>

            <div>
              <Label htmlFor="tracking_number">Tracking Number</Label>
              <Input
                id="tracking_number"
                value={editForm.tracking_number}
                onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                id="admin_notes"
                value={editForm.admin_notes}
                onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                placeholder="Internal notes for this order"
              />
            </div>

            <Button onClick={handleEditOrder} className="w-full">
              Update Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminOrderManager;