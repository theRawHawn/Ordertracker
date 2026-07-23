import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { getStoredCredentials } from '../utils/helpers';
import { googleSignIn } from '../services/googleAuth';
import { BrandLogo } from './BrandLogo';
import { BRAND_CONFIG } from '../config/brandConfig';

interface LoginScreenProps {
  onLoginSuccess: (isReadOnly: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [storedCreds, setStoredCreds] = useState(() => getStoredCredentials());
  const [username, setUsername] = useState(storedCreds.username);
  const [password, setPassword] = useState(storedCreds.password);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const active = getStoredCredentials();
    setStoredCreds(active);
    setUsername(active.username);
    setPassword(active.password);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in both username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const active = getStoredCredentials();
      if (
        username.trim().toLowerCase() === active.username.toLowerCase() &&
        password === active.password
      ) {
        onLoginSuccess(false); // Admin mode: Full access
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleGoogleAdminLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await googleSignIn();
      if (res) {
        onLoginSuccess(false); // Admin mode: Full write access to Google Sheet DB
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed');
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(true); // External Guest mode: View-Only
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {BRAND_CONFIG.appTitle}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vendor, Bank Details & Order Database
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Secure Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* External Guest Access */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-amber-500/30 cursor-pointer shadow-sm"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Guest View-Only Access</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            Read-only mode for external viewers (view & search orders, no edit privileges)
          </p>
        </div>
      </div>
    </div>
  );
};
