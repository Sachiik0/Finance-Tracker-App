// File: app/landing/page.tsx
// Purpose: Landing page with magic link login and step-by-step onboarding for new users

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Question = {
  key: string;
  question: string;
  type: 'number' | 'text' | 'select';
  options?: string[];
};

// Example onboarding questions
const questions: Question[] = [
  { key: 'needs', question: 'What percentage of your budget goes to Needs?', type: 'number' },
  { key: 'wants', question: 'What percentage of your budget goes to Wants?', type: 'number' },
  { key: 'savings', question: 'What percentage of your budget goes to Savings?', type: 'number' },
  { key: 'incomeSources', question: 'What are your money sources?', type: 'text' },
  {
    key: 'separatePercentages',
    question: 'Do you want to separate Income vs Allowance percentages?',
    type: 'select',
    options: ['Yes', 'No'],
  },
  { key: 'savingsGoals', question: 'List your savings goals (name, amount, deadline)', type: 'text' },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [stepError, setStepError] = useState('');
  const toast = useToast();
  const router = useRouter();

  const redirectDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

  // Handle magic link login/register
  const handleMagicLink = async () => {
    if (!email) return toast({ title: 'Email required', description: 'Please enter your email.' });
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Check if profile exists
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
      const isNewUser = !existingUser;

      // Send magic link
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectDomain}?onboarding=${isNewUser ? 'true' : 'false'}`,
        },
      });
      if (magicError) throw magicError;

      setMessage('Check your email for the magic link! Open it to continue.');
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding step navigation
  const handleNextStep = () => {
    const q = questions[currentStep];
    if (!answers[q.key]) {
      setStepError('This field is required.');
      return;
    }
    setStepError('');
    if (currentStep < questions.length - 1) setCurrentStep(currentStep + 1);
    else handleCompleteOnboarding();
  };

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStepError('');
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (!userId) throw new Error('User not logged in');

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          budgetPreferences: {
            needs: answers.needs,
            wants: answers.wants,
            savings: answers.savings,
          },
          incomeSources: answers.incomeSources,
          separatePercentages: answers.separatePercentages === 'Yes',
          savingsGoals: answers.savingsGoals,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Registration failed');

      router.push('/home'); // Redirect to home after onboarding
    } catch (err: any) {
      setStepError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  // Check if redirected from magic link to show onboarding
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
        if (profile) {
          router.push('/home');
        } else {
          setShowOnboarding(true);
        }
      }
    };
    checkSession();
  }, [router]);

  if (showOnboarding) {
    const step = questions[currentStep];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 space-y-4">
        <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
          <p className="font-semibold mb-2">{step.question}</p>
          {step.type === 'number' && (
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={answers[step.key] || ''}
              onChange={(e) => handleChange(step.key, e.target.value)}
            />
          )}
          {step.type === 'text' && (
            <textarea
              className="border p-2 rounded w-full"
              value={answers[step.key] || ''}
              onChange={(e) => handleChange(step.key, e.target.value)}
            />
          )}
          {step.type === 'select' && (
            <select
              className="border p-2 rounded w-full"
              value={answers[step.key] || ''}
              onChange={(e) => handleChange(step.key, e.target.value)}
            >
              <option value="">Select</option>
              {step.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {stepError && (
            <div className="text-red-600 mt-2">{stepError}</div>
          )}
          <Button
            className="mt-4 w-full bg-blue-600 text-white"
            onClick={handleNextStep}
            disabled={loading}
          >
            {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">Take Control of Your Finances</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Track income, expenses, subscriptions, and savings all in one place.
      </p>
      <input
        type="email"
        placeholder="Enter your email"
        className="border p-2 mb-4 rounded w-80"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        onClick={handleMagicLink}
        disabled={loading}
        className="bg-blue-600 text-white w-80"
      >
        {loading ? 'Sending magic link...' : 'Login / Register'}
      </Button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {message && <p className="text-green-600 mt-2">{message}</p>}
    </div>
  );
}
// Note: Ensure NEXT_PUBLIC_APP_DOMAIN is set in .env.local for proper redirection