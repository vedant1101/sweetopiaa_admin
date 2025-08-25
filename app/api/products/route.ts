import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aclnduopdhcvnelptrst.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey?.toString() ?? "");

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { success: false, message: 'No order_id provided' },
        { status: 400 }
      );
    }

    // Fetch all products in the order
    const { data: products, error } = await supabase
      .from('order_products')
      .select('product_id, product_name, quantity, unit_price, total_price')
      .eq('order_id', order_id);

    if (error) throw error;

    // Parse product_id to extract size (e.g. "16-fullSize")
    const finalProducts = products.map(prod => {
      const [id, size] = prod.product_id.split('-');
      return {
        id: parseInt(id, 10),
        product_name: prod.product_name,
        quantity: prod.quantity,
        unit_price: prod.unit_price,
        total_price: prod.total_price,
        size: size || null
      };
    });

    return NextResponse.json({ success: true, products: finalProducts });
  } catch (err) {
    console.error('Error fetching order products:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
