// app/api/apply-allocation/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type ApplyPayload = {
  userId: string;
  year: number;
  month: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyPayload;
    const { userId, year, month } = body;

    if (!userId || !year || !month) {
      return NextResponse.json(
        { error: 'userId, year and month required' },
        { status: 400 }
      );
    }

    // Call the atomic SQL function apply_monthly_allocation
    const { data, error } = await supabaseAdmin.rpc('apply_monthly_allocation', {
      p_user: userId,
      p_year: Number(year),
      p_month: Number(month),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
