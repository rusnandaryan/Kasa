'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Store,
  Layers,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import { BusinessType } from '@/core/types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { branding, updateBranding, applyBusinessPreset, allMembers, reloadMembers } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<BusinessType>(branding.businessType || 'fnb');
  const [brandName, setBrandName] = useState(branding.brandName);
  const [selectedColor, setSelectedColor] = useState(branding.themeColor);
  const [ownerPin, setOwnerPin] = useState('123456');
  const [cashierPin, setCashierPin] = useState('112233');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNextStep1 = async () => {
    await applyBusinessPreset(selectedType);
    setStep(2);
  };

  const handleNextStep2 = async () => {
    await updateBranding({
      brandName: brandName.trim() || 'Usaha Saya',
      themeColor: selectedColor,
    });
    setStep(3);
  };

  const handleFinish = async () => {
    // Update owner & cashier pins
    const ownerMember = allMembers.find((m) => m.role === 'owner');
    const cashierMember = allMembers.find((m) => m.role === 'cashier');

    if (ownerMember) {
      await (await import('@/core/db')).db.members.update(ownerMember.id, {
        pinCode: ownerPin,
      });
    }
    if (cashierMember) {
      await (await import('@/core/db')).db.members.update(cashierMember.id, {
        pinCode: cashierPin,
      });
    }

    await reloadMembers();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Progress header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {step}/4
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Setup Usaha Kasa (Siap Jualan)
              </h3>
              <p className="text-[11px] text-slate-600">
                {step === 1 && 'Langkah 1: Tentukan Jenis Usaha Anda'}
                {step === 2 && 'Langkah 2: Berikan Identitas Brand Anda'}
                {step === 3 && 'Langkah 3: Katalog Contoh Menu Otomatis'}
                {step === 4 && 'Langkah 4: Pasang PIN Pengaman Kasir'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan setup awal"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* STEP 1: Business Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-slate-900">Apa bidang usaha UMKM Anda?</h4>
                <p className="text-xs text-slate-600">
                  KASA secara pintar akan menyesuaikan istilah aplikasi, fitur kasir, dan struktur katalog.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    id: 'fnb',
                    emoji: '☕',
                    title: 'Kuliner / F&B',
                    desc: 'Kafe, Warung, Resto, Toast, Angkringan',
                  },
                  {
                    id: 'retail',
                    emoji: '🛒',
                    title: 'Toko / Retail',
                    desc: 'Sembako, Toko Klontong, Butik, Grosir',
                  },
                  {
                    id: 'service',
                    emoji: '✂️',
                    title: 'Jasa & Layanan',
                    desc: 'Barbershop, Laundry, Servis, Cuci Motor',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(item.id as BusinessType)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      selectedType === item.id
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-3xl mb-2">{item.emoji}</span>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{item.title}</h5>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Branding */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-slate-900">Beri Nama & Warna Brand Anda</h4>
                <p className="text-xs text-slate-600">
                  Aplikasi kasir ini 100% milik toko Anda sendiri.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Brand Toko Anda *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Contoh: Kopi Senja, Toko Berkah"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Warna Aksen Toko
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { name: 'Royal Blue', hex: '#2563EB' },
                    { name: 'Amber Kopi', hex: '#D97706' },
                    { name: 'Hijau Fresh', hex: '#059669' },
                    { name: 'Merah Food', hex: '#E11D48' },
                    { name: 'Dark Slate', hex: '#0F172A' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.hex);
                        useAppStore.getState().applyThemeCssVars(c.hex);
                      }}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                        selectedColor === c.hex ? 'border-slate-900 scale-105 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Catalog Confirmation */}
          {step === 3 && (
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Contoh Menu & Kategori Sudah Siap!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                KASA telah mengisi otomatis 5 contoh produk sesuai jenis usaha Anda (lengkap dengan harga jual, HPP modal, dan varian). Anda dapat mengubah atau menghapusnya kapan saja di menu Katalog.
              </p>
            </div>
          )}

          {/* STEP 4: PIN Security */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-slate-900">Setel 6-Digit PIN Pengaman</h4>
                <p className="text-xs text-slate-600">
                  Untuk membuka layar kunci dan otorisasi pembatalan/diskon transaksi.
                </p>
              </div>

              <div className={`grid gap-3 ${allMembers.some((m) => m.role === 'cashier') ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 space-y-1.5">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase">
                    PIN Pemilik Aplikasi
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full h-10 px-3 rounded-xl border border-purple-300 text-center font-mono font-bold tracking-widest text-sm bg-white"
                  />
                  <p className="text-[10px] text-purple-700">Untuk otorisasi penuh &amp; pengaturan</p>
                </div>

                {allMembers.some((m) => m.role === 'cashier') && (
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                    <label className="block text-[11px] font-bold text-blue-900 uppercase">
                      PIN Staf Kasir
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full h-10 px-3 rounded-xl border border-blue-300 text-center font-mono font-bold tracking-widest text-sm bg-white"
                    />
                    <p className="text-[10px] text-blue-700">Untuk membuka layar shift kasir</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={step === 1 ? handleNextStep1 : step === 2 ? handleNextStep2 : () => setStep(4)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Selesai & Buka Kasir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

