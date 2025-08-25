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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-16">
            <div className="flex items-center min-w-0">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-theme1-primary mr-2 sm:mr-3 flex-shrink-0" />
              <h1 className="text-sm sm:text-xl font-bold text-theme1-primary truncate">Orders Dashboard</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center text-xs sm:text-sm text-theme1-primary hover:text-theme1-secondary transition-colors disabled:opacity-50 p-1 sm:p-0"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="hidden md:flex items-center text-xs sm:text-sm text-theme1-secondary">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate max-w-20 sm:max-w-none">Welcome, {user?.name || user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center text-xs sm:text-sm text-red-600 hover:text-red-800 transition-colors p-1 sm:p-0"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6 flex items-start">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <strong>Error:</strong> <span className="break-words">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-2 underline hover:no-underline text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-theme1-sidebar rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-6 border border-theme1-primary/10">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
            <div className="flex-1 max-w-full sm:max-w-md">
              <div className="flex items-center w-full py-2">
                <img 
                  src="/images/brand_logo_new.png" 
                  alt="Brand Logo" 
                  className="h-8 sm:h-14 object-contain" 
                />
                <span className="ml-2 sm:ml-4 text-lg sm:text-3xl font-bold text-theme1-primary truncate">
                  Sweetopiaa
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-theme1-secondary mr-2 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-initial border border-theme1-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-theme1-tertiary focus:border-transparent bg-theme1-bg text-theme1-primary"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-3 sm:p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-theme1-tertiary flex-shrink-0" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-theme1-secondary truncate">Total Orders</p>
                <p className="text-lg sm:text-2xl font-bold text-theme1-primary">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-3 sm:p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-theme1-secondary truncate">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-theme1-primary">
                  {orders.filter(order => order.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-3 sm:p-6 border border-theme1-primary/10">
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-theme1-secondary truncate">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-theme1-primary">
                  {orders.filter(order => order.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-theme1-sidebar rounded-lg shadow-sm p-3 sm:p-6 border border-theme1-primary/10 col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-theme1-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-theme1-bg font-bold text-sm sm:text-base">₹</span>
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-theme1-secondary truncate">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-theme1-primary">
                  ₹{orders.reduce((sum, order) => sum + (order.status === 'completed' ? order.total : 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table - Mobile Cards / Desktop Table */}
        <div className="bg-theme1-sidebar rounded-lg shadow-sm overflow-hidden border border-theme1-primary/10">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-theme1-primary/20">
            <h2 className="text-base sm:text-lg font-bold text-theme1-primary">Recent Orders</h2>
          </div>
          
          {/* Mobile Cards View */}
          <div className="block lg:hidden">
            {orders.map((order) => (
              <div key={order.id} className="border-b border-theme1-primary/10 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-theme1-primary text-sm">{order.id}</div>
                    <div className="text-xs text-theme1-secondary">{order.itemCount} items</div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <div className="relative">
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
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50 min-w-32">
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
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme1-secondary">Customer:</span>
                    <span className="text-theme1-primary font-medium truncate ml-2">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme1-secondary">Amount:</span>
                    <span className="text-theme1-primary font-bold">₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme1-secondary">Payment:</span>
                    <span className="text-theme1-primary">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme1-secondary">Date:</span>
                    <span className="text-theme1-primary">{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme1-secondary">Shipping:</span>
                    <span className="text-theme1-primary">{order.shippingMethod?.toString().toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => handleViewDetails(order)}
                    className="w-full px-3 py-2 text-sm bg-theme1-primary text-theme1-bg rounded-lg hover:bg-theme1-secondary transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme1-secondary uppercase tracking-wider">Actions</th>
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
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
                <span className="font-semibold text-theme1-primary">{p.product_name}</span>
                <span className="text-theme1-secondary">Size: {p.size}</span>
                <span className="text-theme1-secondary">Quantity: {p.quantity}</span>
                <span className="text-theme1-secondary">
                  Unit Price: ₹{Number(p.unit_price).toFixed(2)}
                </span>
                <span className="text-theme1-primary font-medium">
                  Total: ₹{Number(p.total_price).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded bg-theme1-primary text-theme1-bg hover:bg-theme1-secondary"
          >
            Close
          </button>
        </div>
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