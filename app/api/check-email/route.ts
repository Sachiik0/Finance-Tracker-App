// app/api/check-email/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const { data, error } = await supabaseAdmin.auth.admin.listUsers() as {
    data: { users: any[] },
    error: { message: string } | null
  };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userExists = data.users.some((user: any) => user.email === email);
    return NextResponse.json({ exists: userExists });
  }
