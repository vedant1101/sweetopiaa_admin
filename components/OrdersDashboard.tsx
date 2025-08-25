'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Package, User, CreditCard, Clock, LogOut, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  status: 'completed' | 'pending' | 'processing' | 'cancelled';
  paymentMethod: string;
  orderDate: string;
  shippingAddress: string;
  items: OrderItem[];
  itemCount?: number; // Add optional itemCount field
  productIds?: string[];
  shippingMethod?: string;
}

type OrderProduct = {
    id: number;
    product_name: string;
    size: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  };
  

interface ApiResponse {
  success: boolean;
  orders: Order[];
  total: number;
  error?: string;
}

const OrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const { user, logout } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null); // store orderId when dropdown is open



  // Fetch orders from API
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      params.append('limit', '100');
      params.append('offset', '0');

      const response = await fetch(`/api/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchTerm]); // Add dependencies back so filter values are captured

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // No separate effect needed - fetchOrders will automatically update when statusFilter or searchTerm change

  // Manual refresh function
  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the order status to "${newStatus}"?`
    );
  
    if (!confirmed) return;
  
    try {
      const res = await fetch('/api/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
  
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
  prev.map((order) =>
    String(order.id) === String(orderId)
      ? { ...order, status: newStatus } // 👈 FIXED
      : order
  )
);

        setStatusDropdownOpen(null);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };
  
  
  
  
  

  // Replace old fetchProductDetails with this
const fetchProductDetails = async (orderId: string) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Product details response:', data);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching product details:', err);
    }
  };
  
  
  
  
  

  // Update handleViewDetails
const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    await fetchProductDetails(order.id);  // 👈 send only order.id
    setShowModal(true);
  };
  
  
  
  
  


  const getStatusColor = (status: Order['status']) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme1-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme1-primary mx-auto"></div>
          <p className="mt-4 text-theme1-secondary">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme1-bg">
      {/* Header */}
      <header className="bg-theme1-sidebar shadow-sm border-b border-theme1-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-theme1-primary mr-3" />
              <h1 className="text-xl font-bold text-theme1-primary">Orders Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center text-sm text-theme1-primary hover:text-theme1-secondary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="flex items-center text-sm text-theme1-secondary">
                <User className="w-4 h-4 mr-2" />
                Welcome, {user?.name || user?.username}
              </div>
              <button
                onClick={logout}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {error}
              <button 
                onClick={() => setError('')}
                className="ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-theme1-sidebar rounded-lg shadow-sm p-6 mb-6 border border-theme1-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme1-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-theme1-primary/20 rounded-lg focus:ring-2 focus:ring-theme1-tertiary focus:border-transparent bg-theme1-bg text-theme1-primary"
              /> */}
              <div className="flex items-center w-full py-2">
  <img 
    src="/images/brand_logo_new.png" 
    alt="Brand Logo" 
    className="h-14 object-contain" // increased size
  />
  <span className="ml-4 text-3xl font-bold text-theme1-primary">
    Sweetopiaa
  </span>
</div>


            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-theme1-secondary mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-theme1-primary/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-theme1-tertiary focus:border-transparent bg-theme1-bg text-theme1-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-theme1-tertiary" />
              <div className="ml-4">
                <p className="text-sm text-theme1-secondary">Total Orders</p>
                <p className="text-2xl font-bold text-theme1-primary">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-theme1-secondary">Pending</p>
                <p className="text-2xl font-bold text-theme1-primary">
                  {orders.filter(order => order.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-theme1-secondary">Completed</p>
                <p className="text-2xl font-bold text-theme1-primary">
                  {orders.filter(order => order.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-theme1-primary rounded-full flex items-center justify-center">
                <span className="text-theme1-bg font-bold">₹</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-theme1-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-theme1-primary">
                  ₹{orders.reduce((sum, order) => sum + (order.status === 'completed' ? order.total : 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-theme1-sidebar rounded-lg shadow-sm overflow-hidden border border-theme1-primary/10">
          <div className="px-6 py-4 border-b border-theme1-primary/20">
            <h2 className="text-lg font-bold text-theme1-primary">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme1-primary/10">
              <thead className="bg-theme1-bg/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme1-secondary uppercase tracking-wider">Shipping</th>
                </tr>
              </thead>
              <tbody className="bg-theme1-sidebar divide-y divide-theme1-primary/10">
                {orders.map((order) => (
                  <tr 
                  key={order.id} 
                  className="hover:bg-theme1-bg/30 cursor-pointer"
                  onClick={() => null}
                >
                
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-theme1-primary">{order.id}</div>
                        <div className="text-sm text-theme1-secondary">{order.itemCount} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-theme1-primary">{order.customerName}</div>
                        <div className="text-sm text-theme1-secondary">{order.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-theme1-primary">₹{order.total.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme1-primary relative">
                        
  <div
    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer"
    onClick={() =>
      setStatusDropdownOpen(statusDropdownOpen === order.id ? null : order.id)
    }
  >
    <span className={getStatusColor(order.status)}>
      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
    </span>
  </div>

  {statusDropdownOpen === order.id && (
    <div className="absolute mt-2 bg-white border rounded shadow-lg z-50">
      {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
        <div
          key={status}
          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
            order.status === status ? 'font-bold text-theme1-primary' : 'text-gray-700'
          }`}
          onClick={() => handleStatusChange(order.id, status as Order['status'])}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      ))}
    </div>
  )}
</td>


                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme1-primary">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme1-secondary">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme1-secondary">
                      {order.shippingMethod?.toString().toLocaleUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme1-primary text-right">
  <button
    onClick={() => handleViewDetails(order)}
    className="p-2 rounded-full hover:bg-gray-100"
  >
    ⋮
  </button>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-theme1-secondary mx-auto mb-4" />
              <p className="text-theme1-secondary">No orders found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      <h2 className="text-lg font-bold mb-4 text-theme1-primary">
        Order #{selectedOrder.id} - Products
      </h2>

      {products.length === 0 ? (
        <p className="text-theme1-secondary">No products found</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="border p-3 rounded text-sm flex flex-col gap-1"
            >
              <span className="font-semibold">{p.product_name}</span>
              <span className="text-gray-600">Size: {p.size}</span>
              <span className="text-gray-600">Quantity: {p.quantity}</span>
              <span className="text-gray-600">
                Unit Price: ₹{Number(p.unit_price).toFixed(2)}
              </span>
              <span className="text-gray-800 font-medium">
                Total: ₹{Number(p.total_price).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded bg-theme1-primary text-white hover:bg-theme1-secondary"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



      {/* Footer */}
      <footer className="p-4 text-center mt-auto bg-theme1-sidebar border-t border-theme1-primary/20">
        <p className="text-theme1-secondary text-xs">
          © {new Date().getFullYear()} Sweetopiaa. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default OrdersDashboard;