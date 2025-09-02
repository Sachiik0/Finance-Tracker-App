// app/api/subscriptions/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('subscription_entries') // <- fixed table name
    .select('id, user_id, name, due_day, price, is_paid, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name, due_day, price, is_paid } = body;
    if (!user_id || !name || due_day == null || price == null) {
      return NextResponse.json({ error: 'user_id, name, due_day and price required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('subscription_entries') // <- fixed table name
      .insert([{
        user_id,
        name,
        due_day: Number(due_day),
        price: Number(price),
        is_paid: Boolean(is_paid)
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('subscription_entries') // <- fixed table name
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('subscription_entries') // <- fixed table name
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deleted: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
