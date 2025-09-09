'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ChevronRight, CheckCircle, DollarSign, Target, Calendar, CreditCard, Mail, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Question = {
  key: string;
  question: string;
  type: 'number' | 'text' | 'select' | 'table';
  options?: string[];
  placeholder?: string;
  subtitle?: string;
};

const questions: Question[] = [
  { key: 'needs', question: 'What percentage of your budget goes to Needs?', subtitle: 'Essential expenses like rent, groceries, utilities', type: 'number', placeholder: 'e.g., 50' },
  { key: 'wants', question: 'What percentage goes to Wants?', subtitle: 'Entertainment, dining out, hobbies', type: 'number', placeholder: 'e.g., 30' },
  { key: 'savings', question: 'What percentage goes to Savings?', subtitle: 'Emergency fund, investments, future goals', type: 'number', placeholder: 'e.g., 20' },
  { key: 'incomeSources', question: 'What are your income sources?', subtitle: 'List all sources of income', type: 'text', placeholder: 'e.g., Salary, freelance work...' },
  { key: 'separatePercentages', question: 'Separate Income vs Allowance percentages?', subtitle: 'Different budget rules for different income types?', type: 'select', options: ['Yes','No'] },
  { key: 'savingsGoals', question: 'Savings Goals', subtitle: 'Add goals with amount & deadline', type: 'table' }
];

const featureCards = [
  { icon: DollarSign, title: 'Manual Finance Tracking', description: 'Easily add your income, expenses, and subscriptions with intuitive controls.' },
  { icon: Target, title: 'Smart Budget Allocation', description: 'Allocate percentages to Savings, Needs, and Wants with visual feedback.' },
  { icon: Calendar, title: 'Savings Goals', description: 'Set short-term and long-term goals with progress tracking.' },
  { icon: CreditCard, title: 'Subscription Management', description: 'Track recurring payments and optimize your spending.' },
];

export default function LandingPage() {
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [stepError, setStepError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) router.push('/home');
    };
    checkUser();
  }, [router]);

  const handleMagicLink = async () => {
  if (!email) return toast({ title: 'Email required', description: 'Please enter your email.' });
  setLoading(true); 
  setError(null); 
  setMessage(null);

  try {
    // Check if email exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    const isNewUser = !existingUser;

    // ✅ Use current site domain instead of hardcoding
    const baseUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000";

    const redirectUrl = `${baseUrl}${isNewUser ? '/landing?onboarding=true' : '/home'}`;

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });

    if (magicError) throw magicError;

    setMessage('Check your email for the magic link! Open it to continue.');
  } catch (err: any) {
    setError(err.message || 'Unexpected error.');
  } finally {
    setLoading(false);
  }
};



  const handleChange = (key: string, value: any) => { setAnswers(prev => ({ ...prev, [key]: value })); setStepError(''); };

  const addSavingsGoal = () => {
    const currentGoals = answers.savingsGoals || [];
    setAnswers(prev => ({ ...prev, savingsGoals: [...currentGoals, { name: '', amount: '', deadline: '' }] }));
  };

  const removeSavingsGoal = (index: number) => {
    const currentGoals = answers.savingsGoals || [];
    setAnswers(prev => ({ ...prev, savingsGoals: currentGoals.filter((_: any, i: number) => i !== index) }));
  };

  const updateSavingsGoal = (index:number, field:string, value:string) => {
    const currentGoals = answers.savingsGoals || [];
    const newGoals = [...currentGoals]; newGoals[index] = { ...newGoals[index], [field]: value };
    setAnswers(prev=>({ ...prev, savingsGoals: newGoals })); setStepError('');
  };

  const validateStep = () => {
    const q = questions[currentStep];
    const value = answers[q.key];

    if (q.type === 'table') {
      const goals = value || [];
      if (goals.length === 0) { setStepError('Please add at least one savings goal.'); return false; }
      for(let i=0;i<goals.length;i++){
        const goal = goals[i];
        if(!goal.name||!goal.amount||!goal.deadline){ setStepError(`Fill all fields for goal ${i+1}`); return false; }
        if(isNaN(parseFloat(goal.amount)) || parseFloat(goal.amount)<=0){ setStepError(`Enter valid amount for goal ${i+1}`); return false; }
      }
      return true;
    }

    if(!value||value.trim()===''){ setStepError('This field is required.'); return false; }
    if(q.type==='number'){ const num= parseFloat(value); if(isNaN(num)||num<0||num>100){ setStepError('Enter valid percentage 0-100'); return false; } }
    return true;
  };

  const handleNextStep = () => { if(!validateStep()) return; setStepError(''); if(currentStep<questions.length-1) setCurrentStep(currentStep+1); else handleCompleteOnboarding(); };
  const handlePrevStep = () => { if(currentStep>0){ setCurrentStep(currentStep-1); setStepError(''); } };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if(!userId) throw new Error('User not logged in');
      // API call
      await fetch('/api/onboarding', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, ...answers }) });
      router.push('/home');
    } catch(err:any){ setStepError(err.message || 'Unexpected error'); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    if(params.get('onboarding')==='true'){ setShowOnboarding(true); setAnswers({ savingsGoals:[{name:'',amount:'',deadline:''}] }); }
  },[]);

  // Onboarding UI
  if(showOnboarding){
    const step = questions[currentStep];
    const progress = ((currentStep+1)/questions.length)*100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="h-2 bg-gray-100"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width:`${progress}%`}}/></div>
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={handlePrevStep} disabled={currentStep===0}><ArrowLeft size={16}/></Button>
              <span className="text-sm text-gray-500 font-medium">Step {currentStep+1} of {questions.length}</span>
              <div className="w-8"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.question}</h2>
            {step.subtitle && <p className="text-gray-600 text-sm">{step.subtitle}</p>}
          </div>
          <div className="px-6 pb-6 space-y-4">
            {step.type==='number' && <input type="number" placeholder={step.placeholder} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500" value={answers[step.key]||''} onChange={e=>handleChange(step.key,e.target.value)}/>}
            {step.type==='text' && <textarea placeholder={step.placeholder} className="w-full p-4 border-2 border-gray-200 rounded-xl" value={answers[step.key]||''} onChange={e=>handleChange(step.key,e.target.value)}/>}
            {step.type==='select' && step.options?.map(opt=><Button key={opt} variant={answers[step.key]===opt?'default':'outline'} className="w-full" onClick={()=>handleChange(step.key,opt)}>{opt}</Button>)}
            {step.type==='table' && <>
              {(answers[step.key]||[]).map((goal:any,index:number)=>(
                <div key={index} className="grid grid-cols-3 gap-3 items-center mb-3">
                  <input type="text" placeholder="Goal name" className="p-2 border" value={goal.name||''} onChange={e=>updateSavingsGoal(index,'name',e.target.value)}/>
                  <input type="number" placeholder="Amount" className="p-2 border" value={goal.amount||''} onChange={e=>updateSavingsGoal(index,'amount',e.target.value)}/>
                  <input type="date" className="p-2 border" value={goal.deadline||''} onChange={e=>updateSavingsGoal(index,'deadline',e.target.value)}/>
                  {index>0 && <Button variant="destructive" size="sm" onClick={()=>removeSavingsGoal(index)}><Trash2 size={16}/></Button>}
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addSavingsGoal}><Plus size={16}/> Add Another Goal</Button>
            </>}
            {stepError && <p className="text-red-600">{stepError}</p>}
            <Button onClick={handleNextStep} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {loading ? <Loader2 className="animate-spin"/> : (currentStep===questions.length-1?'Complete Setup':'Continue')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Landing page UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Take Control of Your Finances</h1>
        <p className="text-xl text-gray-600 mb-8">Track income, expenses, subscriptions, and savings all in one platform.</p>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mb-12">
          <div className="flex items-center gap-3 mb-4"><Mail className="text-blue-500" size={24}/><h3 className="text-lg font-semibold">Get Started Free</h3></div>
          <input type="email" placeholder="Enter your email" className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4" value={email} onChange={e=>{setEmail(e.target.value); setError(null)}}/>
          <Button onClick={handleMagicLink} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">{loading?<Loader2 className="animate-spin mx-auto"/>:'Get Magic Link'}</Button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          {message && <p className="text-green-600 mt-2">{message}</p>}
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage your money</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCards.map(card=>{
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl group-hover:from-blue-200 group-hover:to-purple-200 transition-all"><Icon size={28} className="text-blue-600"/></div>
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                </div>
                <p className="text-gray-600">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}