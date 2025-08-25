import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aclnduopdhcvnelptrst.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey?.toString() ?? '');

export async function POST(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing orderId or status' },
        { status: 400 }
      );
    }

    const { error } = await supabase
  .from('orders')
  .update({ order_status: status }) 
  .eq('order_id', orderId); 


    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating order status:', err);
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}
