import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type ApplySavingsPayload = {
  userId: string;
  year: number;
  month: number;
  longTermPct?: number; // optional, default 70
  shortTermPct?: number; // optional, default 30
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplySavingsPayload;
    const { userId, year, month, longTermPct = 70, shortTermPct = 30 } = body;

    if (!userId || !year || !month) {
      return NextResponse.json(
        { error: 'userId, year, and month required' },
        { status: 400 }
      );
    }

    // 1️⃣ Get total income for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateObj = new Date(year, month, 0); // month is 1-based
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
      endDateObj.getDate()
    ).padStart(2, '0')}`;

    const { data: incomes, error: incomeErr } = await supabaseAdmin
      .from('income_entries')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (incomeErr) throw incomeErr;

    const totalIncome =
      incomes?.reduce((sum, i: any) => sum + Number(i.amount), 0) || 0;

    // 2️⃣ Get savings percentage
    const { data: alloc, error: allocErr } = await supabaseAdmin
      .from('user_allocations')
      .select('savings_pct')
      .eq('user_id', userId)
      .single();

    if (allocErr) throw allocErr;
    const savingsPct = Number(alloc?.savings_pct || 0);

    let savingsFund = (totalIncome * savingsPct) / 100;

    // 3️⃣ Deduct subscriptions for the month
    const { data: subs, error: subErr } = await supabaseAdmin
      .from('subscription_entries')
      .select('price, is_paid')
      .eq('user_id', userId)
      .eq('is_paid', false);

    if (subErr) throw subErr;

    const totalUnpaidSubs =
      subs?.reduce((sum: number, s: any) => sum + Number(s.price), 0) || 0;
    savingsFund -= totalUnpaidSubs;
    if (savingsFund < 0) savingsFund = 0;

    // 4️⃣ Split savings fund into long-term and short-term
    const longTermAmount = (savingsFund * longTermPct) / 100;
    const shortTermAmount = (savingsFund * shortTermPct) / 100;

    // 5️⃣ Get user's savings goals
    const { data: goals, error: goalsErr } = await supabaseAdmin
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    if (goalsErr) throw goalsErr;

    // Split into long-term vs short-term
    const longTermGoals = goals.filter((g: any) => g.category === 'long-term');
    const shortTermGoals = goals.filter((g: any) => g.category === 'short-term');

    // 6️⃣ Allocate amount proportionally based on target_amount
    const allocateProportionally = (goalList: any[], totalAmt: number) => {
      const totalTarget = goalList.reduce(
        (sum: number, g) => sum + Number(g.target_amount),
        0
      );
      return goalList.map((g) => ({
        ...g,
        allocated_amount: totalTarget
          ? (Number(g.target_amount) / totalTarget) * totalAmt
          : 0,
      }));
    };

    const updatedLongTerm = allocateProportionally(longTermGoals, longTermAmount);
    const updatedShortTerm = allocateProportionally(shortTermGoals, shortTermAmount);
    const updatedGoals = [...updatedLongTerm, ...updatedShortTerm];

    // 7️⃣ Update savings_goals table
    for (const goal of updatedGoals) {
      await supabaseAdmin
        .from('savings_goals')
        .update({ allocated_amount: goal.allocated_amount })
        .eq('id', goal.id);
    }

    return NextResponse.json({
      ok: true,
      totalIncome,
      savingsFund,
      longTermAmount,
      shortTermAmount,
      updatedGoals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
