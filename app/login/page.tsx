// File: app/login/page.tsx
// Purpose: Login page with both password and magic link options

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Traditional login
  const handlePasswordLogin = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (!userId) throw new Error('Could not get user ID');

      // Call onboarding API or fetch initial data
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Magic Link login
  const handleMagicLink = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage(`Check your email for the magic link to log in!`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-4 rounded w-80"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (optional for magic link)"
        className="border p-2 mb-4 rounded w-80"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-80 mb-2"
        onClick={handlePasswordLogin}
        disabled={loading || !password}
      >
        {loading && password ? 'Logging in...' : 'Login with Password'}
      </button>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded w-80"
        onClick={handleMagicLink}
        disabled={loading}
      >
        {loading && !password ? 'Sending magic link...' : 'Login with Magic Link'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {message && <p className="text-green-600 mt-2">{message}</p>}
    </div>
  );
}
