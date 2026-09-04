'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed.');
      } else {
        if (data.accessToken) {
          localStorage.setItem('jemy_token', data.accessToken);
        }
        router.push('/account');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length > 8 ? (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 'strong' : 'medium') : form.password.length > 0 ? 'weak' : '';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#EAEBE6]">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-900 p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border border-platinum-100/5 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border border-platinum-100/5 -translate-x-1/2 translate-y-1/2" />
        <Link href="/" className="text-2xl font-serif tracking-[0.25em] text-gold-gradient">JEMY</Link>
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-4">Join Jemy</p>
          <h2 className="font-serif text-5xl text-platinum-100 leading-[1.05] mb-6">
            Craft your<br />
            <em className="text-gold-primary">optical identity.</em>
          </h2>
          <div className="space-y-3 mt-8">
            {['Exclusive member pricing', 'Track every order in real-time', 'Save prescriptions securely', 'Early access to new collections'].map(b => (
              <div key={b} className="flex items-center gap-3 text-platinum-100/60 text-sm">
                <div className="w-5 h-5 rounded-full bg-gold-primary/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-gold-primary" />
                </div>
                {b}
              </div>
            ))}
          </div>
        </div>
        <p className="text-platinum-100/30 text-xs">© {new Date().getFullYear()} Jemy. All rights reserved.</p>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-8 lg:p-16 pt-28 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <Link href="/" className="lg:hidden block text-xl font-serif tracking-[0.25em] text-gold-gradient mb-10">JEMY</Link>
          <p className="text-[11px] uppercase tracking-[0.15em] text-gold-primary font-semibold mb-3">Get started</p>
          <h1 className="font-serif text-4xl text-indigo-900 tracking-tight mb-10">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Full Name', field: 'name', type: 'text', placeholder: 'Your full name' },
              { label: 'Email', field: 'email', type: 'email', placeholder: 'you@example.com' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-indigo-900/60">{label}</label>
                <input
                  type={type}
                  value={(form as any)[field]}
                  onChange={update(field)}
                  required
                  placeholder={placeholder}
                  className="w-full bg-white border border-indigo-900/10 focus:border-gold-primary rounded-lg px-4 py-3.5 text-sm text-indigo-900 placeholder:text-indigo-900/30 outline-none transition-colors"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-indigo-900/60">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white border border-indigo-900/10 focus:border-gold-primary rounded-lg px-4 py-3.5 text-sm text-indigo-900 placeholder:text-indigo-900/30 outline-none transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-900/40 hover:text-indigo-900 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="flex gap-1.5 mt-2">
                  {['weak', 'medium', 'strong'].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      (strength === 'weak' && s === 'weak') ? 'bg-red-400' :
                      (strength === 'medium' && (s === 'weak' || s === 'medium')) ? 'bg-amber-400' :
                      (strength === 'strong') ? 'bg-green-400' : 'bg-indigo-900/10'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-indigo-900 text-platinum-100 text-[11px] font-bold uppercase tracking-[0.12em] py-4 rounded-lg hover:bg-gold-primary hover:text-indigo-900 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create Account <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-indigo-900/55 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-primary font-semibold hover:text-gold-dark transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
