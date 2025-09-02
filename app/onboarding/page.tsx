// app/onboarding/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  key: string;
  question: string;
  type: 'number' | 'text' | 'select';
  options?: string[];
};

const questions: Question[] = [
  {
    key: 'needs',
    question: 'What percentage of your budget goes to Needs?',
    type: 'number',
  },
  {
    key: 'wants',
    question: 'What percentage of your budget goes to Wants?',
    type: 'number',
  },
  {
    key: 'savings',
    question: 'What percentage of your budget goes to Savings?',
    type: 'number',
  },
  {
    key: 'incomeSources',
    question: 'What are your money sources?',
    type: 'text',
  },
  {
    key: 'separatePercentages',
    question: 'Do you want to separate Income vs Allowance percentages?',
    type: 'select',
    options: ['Yes', 'No'],
  },
  {
    key: 'savingsGoals',
    question: 'List your savings goals (name, amount, deadline)',
    type: 'text',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async () => {
    setErrors({});
    setLoading(true);

    const total =
      Number(answers.needs || 0) +
      Number(answers.wants || 0) +
      Number(answers.savings || 0);
    if (total !== 100) {
      setErrors({ needs: 'Percentages must sum to 100', wants: '', savings: '' });
      setLoading(false);
      return;
    }

    try {
      const userId = localStorage.getItem('user_id');
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

      router.push('/');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 space-y-4">
      {questions.map((q) => (
        <div key={q.key} className="bg-white p-4 rounded shadow w-full max-w-md relative">
          <p className="font-semibold mb-2">{q.question}</p>
          {q.type === 'number' && (
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={answers[q.key] || ''}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          )}
          {q.type === 'text' && (
            <textarea
              className="border p-2 rounded w-full"
              value={answers[q.key] || ''}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          )}
          {q.type === 'select' && (
            <select
              className="border p-2 rounded w-full"
              value={answers[q.key] || ''}
              onChange={(e) => handleChange(q.key, e.target.value)}
            >
              <option value="">Select</option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {errors[q.key] && (
            <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded shadow text-sm">
              {errors[q.key]}
            </div>
          )}
        </div>
      ))}

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded w-full max-w-md"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Complete Registration'}
      </button>
    </div>
  );
}
