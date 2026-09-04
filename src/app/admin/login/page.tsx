'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Forbidden: Administrative access only');
      }

      // Store JWT token securely (for admin we use localStorage to pass via Bearer headers)
      localStorage.setItem('adminToken', data.accessToken);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[var(--color-admin-bg)] flex items-center justify-center z-50">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-gold-dark)] opacity-5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-[var(--color-admin-accent)] opacity-10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-10 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-[var(--color-gold-primary)] tracking-tight mb-2">JEMY.</h1>
          <p className="text-[var(--color-admin-text-muted)] text-sm tracking-wide uppercase">Admin Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3 text-[var(--color-admin-text)] outline-none transition-colors focus:border-[var(--color-gold-primary)]"
              placeholder="admin@jemy.com"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="block text-xs font-semibold text-[var(--color-admin-text-muted)] uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg pl-4 pr-12 py-3 text-[var(--color-admin-text)] outline-none transition-colors focus:border-[var(--color-gold-primary)]"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-admin-text-muted)] hover:text-[var(--color-admin-text)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative overflow-hidden bg-[var(--color-gold-primary)] text-[var(--color-indigo-950)] font-bold tracking-wide py-3.5 rounded-lg transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={20} />
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2">
                AUTHENTICATE
              </span>
            )}
            {/* Subtle hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </form>
      </div>
    </div>
  );
}
