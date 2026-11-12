'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Delete, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/core/store';

export const PinLockScreen: React.FC = () => {
  const { branding, unlockWithPin, logout } = useAppStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyClick = useCallback((digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 6) {
        const success = unlockWithPin(nextPin);
        if (!success) {
          setErrorMsg('PIN 6-digit salah. Coba lagi.');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  }, [pin, unlockWithPin]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setErrorMsg('');
  }, []);

  // Physical Keyboard PIN Input (0-9, Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyClick, handleBackspace, handleClear]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Brand Logo & Name */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs mb-3 flex items-center justify-center">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.brandName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="font-bold text-2xl text-blue-600">
              {branding.brandName.charAt(0)}
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {branding.brandName}
        </h2>
        <p className="text-xs text-slate-600 mt-0.5 text-center">
          Masukkan 6-Digit PIN Kasir atau Admin untuk membuka
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center gap-3 my-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'scale-110 shadow-xs'
                    : 'bg-slate-200'
                }`}
                style={
                  isFilled
                    ? { backgroundColor: 'var(--brand-primary, #2563EB)' }
                    : undefined
                }
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-4 animate-shake">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-xl font-bold text-slate-800 transition-all flex items-center justify-center select-none shadow-2xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            aria-label="Reset input PIN"
            className="h-14 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center select-none"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-xl font-bold text-slate-800 transition-all flex items-center justify-center select-none shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Hapus satu angka PIN"
            className="h-14 rounded-2xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center select-none"
            title="Hapus"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Session switch/logout action */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full text-center space-y-2">
          <p className="text-[11px] text-slate-600">
            Masukkan 6-digit PIN akun Anda untuk membuka layar kasir.
          </p>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
          >
            Keluar &amp; Login dengan ID Lain
          </button>
        </div>
      </div>
    </div>
  );
};
