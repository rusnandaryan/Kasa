'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, KeyRound, LogIn, ShieldAlert, User } from 'lucide-react';
import { useAppStore } from '@/core/store';
import { verifyPassword } from '@/core/auth';

export const LoginScreen: React.FC = () => {
  const { allMembers, loginWithCredentials } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreshDefaultSetup =
    allMembers.length === 1 &&
    allMembers[0].role === 'owner' &&
    allMembers[0].username === 'owner' &&
    verifyPassword('owner123', allMembers[0].passwordHash);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Masukkan ID pengguna dan password Anda.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    const result = await loginWithCredentials(username, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error || 'Gagal masuk. Periksa ID dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 antialiased select-none">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Locked KASA Application Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs mb-3 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Logo KASA"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            KASA
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Sistem Kasir &amp; Pembukuan UMKM
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              ID Pengguna
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan ID (contoh: owner)"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan password"
                className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl font-bold text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--brand-primary, #2563EB)',
              color: 'var(--brand-primary-text, #FFFFFF)',
            }}
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Memeriksa Akun...' : 'Masuk ke Kasir'}</span>
          </button>
        </form>

        {/* Shown only before owner changes default password or creates store accounts */}
        {isFreshDefaultSetup && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">Akses Awal Pemilik Aplikasi</p>
            <p>
              ID: <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-900">owner</code>{' '}
              | Password: <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-900">owner123</code>
            </p>
            <p className="text-[11px] text-slate-500">
              Setelah masuk, ubah password dan buat akun Admin Toko atau Kasir di menu Staf &amp; Akses.
            </p>
          </div>
        )}
      </div>

      <p className="mt-5 text-[11px] text-slate-500 text-center">
        Hak akses bertingkat: Pemilik Aplikasi, Admin Toko, dan Kasir.
      </p>
    </div>
  );
};

