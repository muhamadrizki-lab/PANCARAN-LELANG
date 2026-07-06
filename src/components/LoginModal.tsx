import React, { useState } from 'react';
import { Shield, Mail, Lock, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { AdminUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
  admins: AdminUser[];
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, admins }: LoginModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Simulated short timeout for a realistic network/security check feel
    setTimeout(() => {
      // 1. First, look for a matching registered admin
      const matchedAdmin = admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (matchedAdmin) {
        const expectedPassword = matchedAdmin.password || '12345678';
        if (cleanPassword === expectedPassword) {
          onLoginSuccess(cleanEmail);
          onClose();
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to default test login credentials for standard testing
      const isPancaranEmail = cleanEmail.endsWith('@pancaran-logistic.id') || cleanEmail.endsWith('@pancaran-group.id');
      const isValidAdmin = cleanEmail === 'digital.solution@pancaran-logistic.id' || cleanEmail === 'email@pancaran-logistic.id' || isPancaranEmail;

      if (isValidAdmin && cleanPassword === '12345678' && !matchedAdmin) {
        onLoginSuccess(cleanEmail);
        onClose();
        setIsLoading(false);
      } else {
        setError(t('Email atau password salah. Pastikan kredensial benar.'));
        setIsLoading(false);
      }
    }, 800);
  };

  const fillDefaultCredentials = () => {
    setEmail('digital.solution@pancaran-logistic.id');
    setPassword('12345678');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border border-slate-100">
        
        {/* Banner header image/gradient */}
        <div className="bg-gradient-to-br from-indigo-700 to-blue-900 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg bg-black/10 hover:bg-black/25 text-white/80 hover:text-white transition-all"
            title={t('Tutup')}
          >
            <X className="w-5 h-5" />
          </button>
          
          <Shield className="w-12 h-12 text-blue-200 mx-auto mb-2.5" />
          <h2 className="text-xl font-bold tracking-tight">{t('Otoritas Internal Admin')}</h2>
          <p className="text-xs text-blue-100/80 mt-1">{t('Gunakan email & password terdaftar untuk mengelola sistem lelang.')}</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">{t('ALAMAT EMAIL KERJA')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="•••••••••••••••@pancaran-logistic.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">{t('KATA SANDI (PASSWORD)')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{t('Masuk Aplikasi')}</span>
            )}
          </button>

          {/* Preset Helper box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{t('Petunjuk Akun Penguji:')}</span>
            </div>
            <p className="text-slate-500 leading-normal">
              {t('Untuk menguji fitur admin, silakan klik tombol di bawah untuk mengisi kredensial default dari user secara instan.')}
            </p>
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all border border-indigo-100 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> {t('Isi Kredensial Penguji')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
