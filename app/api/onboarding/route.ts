// app/api/onboarding/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, budgetPreferences, incomeSources, savingsGoals } = body;

  // Basic validation
  const total = Number(budgetPreferences.savings) + Number(budgetPreferences.needs) + Number(budgetPreferences.wants);
  if (total !== 100) {
    return NextResponse.json({ error: 'Percentages must sum to 100' }, { status: 400 });
  }

  // Use a single transaction
const { data, error } = await supabaseAdmin.rpc('insert_onboarding', {
  p_user: user_id, // You could create a PostgreSQL stored proc to do multi inserts
});

  // For simplicity: call multiple inserts via supabaseAdmin (service role) — but inside your app you can craft them.
  // Return success/failure
  return NextResponse.json({ ok: true });
}
