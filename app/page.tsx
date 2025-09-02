// app/landing/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useToast(); // ✅ get the toast function from the hook

  // Magic link login/register
  const handleMagicLink = async () => {
    if (!email) return toast({ title: 'Email required', description: 'Please enter your email.' });

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message });
    } else {
      toast({ title: 'Check your email', description: 'Magic link sent! Open it to continue.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="max-w-3xl w-full text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">Take Control of Your Finances</h1>
        <p className="text-lg text-gray-600">
          Track income, expenses, subscriptions, and savings all in one place.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <Button
            onClick={handleMagicLink}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? 'Sending...' : 'Login / Register'}
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          <div className="p-4 border rounded-md shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-semibold">Manual Finance Tracking</h3>
            <p className="text-gray-600 mt-2">Easily add your income, expenses, and subscriptions.</p>
          </div>
          <div className="p-4 border rounded-md shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-semibold">Budget Allocation</h3>
            <p className="text-gray-600 mt-2">Allocate percentages to Savings, Needs, and Wants.</p>
          </div>
          <div className="p-4 border rounded-md shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-semibold">Savings Goals</h3>
            <p className="text-gray-600 mt-2">Set short-term and long-term savings goals with deadlines.</p>
          </div>
          <div className="p-4 border rounded-md shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-semibold">Subscription Management</h3>
            <p className="text-gray-600 mt-2">Track recurring payments and prioritize funds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
