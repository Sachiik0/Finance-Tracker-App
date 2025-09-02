// app/register/page.tsx
// app/register/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Listen for auth state changes (e.g., magic link login)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          // Insert profile if it does not exist
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (!data) {
            await supabase.from('profiles').insert([{ id: user.id, email: user.email }]);
          }
          router.push('/onboarding');
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Check if email is already registered
  const checkEmailRegistered = async (email: string) => {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.exists;
  };

  const handleSignup = async (useMagicLink = false) => {
    setLoading(true);
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Email is required.');
      setLoading(false);
      return;
    }

    // Check if email is already registered
    const isRegistered = await checkEmailRegistered(email);
    if (isRegistered) {
      setErrorMessage('Email is already registered.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (useMagicLink) {
        response = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_MAGIC_LINK_REDIRECT || 'http://localhost:3000/onboarding',
          },
        });
        if (response.error) throw response.error;
        alert('Check your email for the magic link.');
      } else {
        if (!password) {
          setErrorMessage('Password is required for normal signup.');
          setLoading(false);
          return;
        }
        response = await supabase.auth.signUp({ email, password });
        if (response.error) throw response.error;

        // Insert profile immediately for password signup
        if (response.data.user) {
          await supabase.from('profiles').insert([{ id: response.data.user.id, email }]);
          router.push('/onboarding'); // redirect after signup
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {errorMessage && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4">{errorMessage}</div>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Password (optional if using magic link)
          </label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2"
          onClick={() => handleSignup(false)}
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <button
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          onClick={() => handleSignup(true)}
          disabled={loading}
        >
          {loading ? 'Sending magic link...' : 'Sign Up with Magic Link'}
        </button>
      </div>
    </div>
  );
}
