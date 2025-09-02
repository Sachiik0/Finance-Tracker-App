// app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  let query = supabaseAdmin
    .from('expense_entries') // use correct table
    .select('id, user_id, category, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (start) query = query.gte('created_at', start);
  if (end) query = query.lte('created_at', end);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, category, amount } = body;
    if (!user_id || !amount || !category) {
      return NextResponse.json({ error: 'user_id, category, and amount required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('expense_entries')
      .insert([{ user_id, category, amount: Number(amount) }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ expense: data });
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
      .from('expense_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ expense: data });
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
      .from('expense_entries')
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
