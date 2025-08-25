import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://aclnduopdhcvnelptrst.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey?.toString() ?? "")

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query using correct column names from your schema
    let query = supabase
      .from('orders')
      .select('order_id, order_number, customer_name, customer_email, customer_phone, total_amount, payment_method, payment_status, order_status, created_at, shipping_address_line1, shipping_city, shipping_state, shipping_postal_code, product_ids, transaction_id,shipping_method')
      .order('created_at', { ascending: false });

    // Apply search filter using correct column names
    if (search) {
        query = query.or(
          `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,order_number.ilike.%${search}%`
        );
      
        // Special handling for numeric search (order_id)
        if (!isNaN(Number(search))) {
          query = query.or(`order_id.eq.${Number(search)}`);
        }
      }
      

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: orders, error } = await query;

    // Check for any errors during fetch
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          orders: [],
          total: 0
        },
        { status: 500 }
      );
    }

    // Transform and filter the data
    let transformedOrders = (orders || []).map(order => {
      // Get product count from product_ids column - format: ["16-fullSize"]
      let productCount = 0;
      
      try {
        console.log('Raw product_ids:', order.product_ids, 'Type:', typeof order.product_ids);
        
        if (order.product_ids) {
          if (typeof order.product_ids === 'string') {
            // Parse JSON array: ["16-fullSize", "17-halfSize"]
            const productIds = JSON.parse(order.product_ids);
            productCount = Array.isArray(productIds) ? productIds.length : 0;
            console.log('Parsed product_ids:', productIds, 'Count:', productCount);
          } else if (Array.isArray(order.product_ids)) {
            // Already an array
            productCount = order.product_ids.length;
            console.log('Product_ids is already array:', order.product_ids, 'Count:', productCount);
          }
        } else {
          console.log('No product_ids found for order:', order.order_id);
        }
      } catch (e) {
        console.error('Error parsing product_ids for order:', order.order_id, e);
        productCount = 0;
      }

      // Debug: Log order data
      console.log('Order:', order.order_id, 'Payment Method:', order.payment_method, 'Payment Status:', order.payment_status, 'Order Status:', order.order_status, 'Product Count:', productCount);

      // Determine status - use order_status if available, otherwise derive from payment data
      let orderStatus: 'completed' | 'pending' | 'processing' | 'cancelled' = 'pending';
      
      if (order.order_status) {
        // Use the order_status column directly if it exists
        orderStatus = order.order_status as 'completed' | 'pending' | 'processing' | 'cancelled';
      } else {
        // Fallback to payment-based status determination
        if (order.payment_method === 'razorpay') {
          if (order.payment_status === 'completed' || (order.transaction_id && order.transaction_id.trim() !== '')) {
            orderStatus = 'completed';
          } else {
            orderStatus = 'pending';
          }
        } else if (order.payment_method === 'cod') {
          orderStatus = 'processing';
        }
      }

      return {
        id: order.order_id,
        customerName: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        total: order.total_amount,
        status: orderStatus,
        paymentMethod: order.payment_method === 'razorpay' ? 'Razorpay' : 'Cash on Delivery',
        orderDate: order.created_at,
        shippingAddress: `${order.shipping_address_line1}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`,
        items: [], // Empty since we're only using product_ids count
        itemCount: productCount, // Use count from product_ids array
        productIds: order.product_ids,
        shippingMethod: order.shipping_method
      };
    });

    // Debug: Log the transformed orders with their statuses
    console.log('Transformed orders with statuses:', transformedOrders.map(o => ({ 
      id: o.id, 
      status: o.status, 
      paymentMethod: o.paymentMethod, 
      itemCount: o.itemCount, 
      customerName: o.customerName 
    })));

    // Apply status filter on transformed data
    if (status && status !== 'all') {
      console.log('Filtering by status:', status);
      const beforeFilter = transformedOrders.length;
      transformedOrders = transformedOrders.filter(order => {
        const matches = order.status === status;
        console.log(`Order ${order.id}: status="${order.status}", filter="${status}", match=${matches}`);
        return matches;
      });
      console.log(`Filtered orders: ${beforeFilter} → ${transformedOrders.length} (showing only ${status})`);
    }

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length
    });

  } catch (error) {
    console.error('Unexpected error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        orders: [],
        total: 0
      },
      { status: 500 }
    );
  }
}