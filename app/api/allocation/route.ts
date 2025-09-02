// app/api/allocation/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, year, month } = body;

    if (!userId || !year || !month) {
      return NextResponse.json({ error: 'userId, year and month required' }, { status: 400 });
    }

    const yr = Number(year);
    const mo = Number(month);
    if (isNaN(yr) || isNaN(mo) || mo < 1 || mo > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    // Sum total income for the month
    const { data: incomeData, error: incomeError } = await supabaseAdmin
      .from('income_entries')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', `${yr}-${String(mo).padStart(2,'0')}-01`)
      .lt('created_at', `${yr}-${String(mo + 1).padStart(2,'0')}-01`);

    if (incomeError) throw incomeError;

    const totalIncome = incomeData?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

    // Sum total expenses for the month
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expense_entries')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', `${yr}-${String(mo).padStart(2,'0')}-01`)
      .lt('created_at', `${yr}-${String(mo + 1).padStart(2,'0')}-01`);

    if (expenseError) throw expenseError;

    const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    // Return allocation summary
    return NextResponse.json({
      ok: true,
      allocation: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        remaining: totalIncome - totalExpenses,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
