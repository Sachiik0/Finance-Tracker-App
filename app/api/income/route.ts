// app/api/income/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type CreateIncomeBody = {
  user_id: string;
  source?: string | null;
  amount: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  let query = supabaseAdmin
    .from('income_entries')
    .select('id, user_id, source, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateIncomeBody;
    if (!body.user_id || body.amount == null) {
      return NextResponse.json({ error: 'user_id and amount are required' }, { status: 400 });
    }

    const payload = {
      user_id: body.user_id,
      source: body.source ?? 'Other',
      amount: Number(body.amount),
    };

    const { data, error } = await supabaseAdmin
      .from('income_entries')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ income: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    if (updates.amount != null) updates.amount = Number(updates.amount);

    const { data, error } = await supabaseAdmin
      .from('income_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ income: data });
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
      .from('income_entries')
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
