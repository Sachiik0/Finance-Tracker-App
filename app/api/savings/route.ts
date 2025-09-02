// app/api/savings/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type CreateSavingsBody = {
  user_id: string;
  name: string;
  target_amount: number;
  allocated_amount?: number;
};

// GET: list savings goals
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create a new savings goal
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateSavingsBody;
    if (!body.user_id || !body.name || body.target_amount == null) {
      return NextResponse.json({ error: 'user_id, name, target_amount required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('savings_goals')
      .insert([{
        user_id: body.user_id,
        name: body.name,
        target_amount: Number(body.target_amount),
        allocated_amount: Number(body.allocated_amount ?? 0)
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ savings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

// PATCH: update a savings goal
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ savings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

// DELETE: remove a savings goal
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('savings_goals')
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
