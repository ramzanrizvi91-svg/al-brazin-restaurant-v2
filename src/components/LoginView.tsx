import React, { useState } from 'react';
import { ShieldCheck, LogIn, Building2, Key, AlertCircle } from 'lucide-react';
import { playChime } from './AudioAlert';

interface LoginViewProps {
  onLoginSuccess: (session: {
    username: string;
    role: 'admin' | 'staff';
    branchId: string | null;
    branchName: string;
  }) => void;
  targetRole: 'staff' | 'admin';
}

export default function LoginView({ onLoginSuccess, targetRole }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const user = await res.json();

        // Check roles
        if (targetRole === 'admin' && user.role !== 'admin') {
          setError('Access denied. Admin portal requires administrator credentials.');
          playChime('waiter');
          setSubmitting(false);
          return;
        }

        playChime('success');
        onLoginSuccess({
          username: user.username,
          role: user.role,
          branchId: user.branchId,
          branchName: user.label || (user.role === 'admin' ? 'Super Admin (All Branches)' : `${user.username} Staff`)
        });
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Invalid username or password. Please try again.');
        playChime('waiter');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to security server failed.');
      playChime('waiter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-[#111111]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative top orange highlight line */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
      
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-orange-glow mb-4">
          <Building2 className="w-6 h-6 text-black" />
        </div>
        <h2 className="text-xl font-bold tracking-tight uppercase text-neutral-100">
          Al-Brazin <span className="text-amber-500 italic">Restaurants & Co.</span>
        </h2>
        <p className="text-neutral-400 text-xs mt-1 font-medium">
          {targetRole === 'admin' ? '🔒 Enterprise SaaS Admin Portal' : '🍳 Staff Kitchen Display & Cashier System'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start space-x-2.5 text-red-400 text-xs animate-pulse">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Username</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. golden"
              autoComplete="username"
              className="w-full bg-neutral-950/80 border border-white/10 focus:border-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Password</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-neutral-950/80 border border-white/10 focus:border-amber-500 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer mt-2"
        >
          <LogIn className="w-4 h-4" />
          <span>{submitting ? 'Verifying...' : 'Authorize Access'}</span>
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-white/5 flex items-start space-x-2 text-[10px] text-neutral-500">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p>Sessions are secured with hashed passwords and an encrypted, HTTP-only session cookie. Contact your Super Admin if you've forgotten your credentials.</p>
      </div>
    </div>
  );
}
