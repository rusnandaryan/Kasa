'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Delete } from 'lucide-react';
import { useAppStore } from '@/core/store';

interface SupervisorModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SupervisorModal: React.FC<SupervisorModalProps> = ({
  isOpen,
  title,
  description,
  onSuccess,
  onCancel,
}) => {
  const { allMembers } = useAppStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleKeyClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 6) {
        const adminMatch = allMembers.find(
          (m) => (m.role === 'owner' || m.role === 'admin') && m.pinCode === nextPin && m.isActive
        );

        if (adminMatch) {
          onSuccess();
          setPin('');
        } else {
          setErrorMsg('Otorisasi Gagal: PIN Admin salah.');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center animate-in zoom-in-95 duration-150 relative">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup modal otorisasi supervisor"
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 text-center">{title}</h3>
        <p className="text-xs text-slate-600 mt-1 text-center">{description}</p>

        {/* PIN Dots */}
        <div className="flex items-center gap-3 my-5">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                index < pin.length ? 'bg-amber-500 scale-110' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {errorMsg && <p className="text-xs font-semibold text-rose-600 mb-3">{errorMsg}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-lg font-bold text-slate-800 transition-all flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-lg font-bold text-slate-800 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Hapus satu angka PIN"
            className="h-12 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-600 mt-4 text-center">
          Gunakan PIN Admin (Default: <strong className="text-slate-800">123456</strong>)
        </p>
      </div>
    </div>
  );
};
