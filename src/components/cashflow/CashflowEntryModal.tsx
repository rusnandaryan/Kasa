'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Camera, Check } from 'lucide-react';
import { CashflowType, FundSource } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';

interface CashflowEntryModalProps {
  isOpen: boolean;
  initialType?: CashflowType;
  onClose: () => void;
  onSaved: () => void;
}

export const CashflowEntryModal: React.FC<CashflowEntryModalProps> = ({
  isOpen,
  initialType = 'expense',
  onClose,
  onSaved,
}) => {
  const { branding, activeMember, activeShift } = useAppStore();

  const [entryType, setEntryType] = useState<CashflowType>(initialType);
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('Bahan Baku');
  const [fundSource, setFundSource] = useState<FundSource>('cash_drawer');
  const [description, setDescription] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string>('');

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

  const expenseCategories = [
    'Bahan Baku',
    'Operasional Toko',
    'Listrik & Air',
    'Gaji & Uang Makan Karyawan',
    'Sewa Tempat',
    'Peralatan & Maintenance',
    'Lainnya',
  ];

  const incomeCategories = [
    'Tambahan Modal Laci',
    'Pendapatan Lain-lain',
    'Komisi / Cashback',
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Nominal harus lebih besar dari Rp 0.');
      return;
    }
    if (!description.trim()) {
      alert('Keterangan kas wajib diisi.');
      return;
    }

    const now = new Date().toISOString();

    await db.cashflow.add({
      id: `cf-${Date.now()}`,
      storeId: branding.id,
      shiftId: activeShift?.id,
      createdBy: activeMember.id,
      creatorName: activeMember.fullName,
      entryType,
      category,
      fundSource,
      amount,
      description: description.trim(),
      receiptPhotoUrl: receiptPhotoUrl || undefined,
      transactionDate: now,
      createdAt: now,
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Catat {entryType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </h3>
            <p className="text-xs text-slate-600">
              Tambahkan Pemasukan/Pengeluaran Secara Manual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form catatan kas"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setEntryType('expense');
                setCategory('Bahan Baku');
              }}
              className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${entryType === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryType('income');
                setCategory('Tambahan Modal Laci');
              }}
              className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${entryType === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nominal (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                Rp
              </span>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                autoFocus
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 text-lg font-extrabold tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {amount > 0 && (
              <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">
                Terbaca: {formatRupiah(amount)}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kategori Kas *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              {(entryType === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Fund Source (Laci vs Rekening) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sumber Dana Kas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFundSource('cash_drawer')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${fundSource === 'cash_drawer'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
              >
                <p className="font-bold">Kas Laci Kasir</p>
                <p className="text-[10px] text-slate-500 font-normal">Mempengaruhi uang fisik laci</p>
              </button>

              <button
                type="button"
                onClick={() => setFundSource('bank_owner')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${fundSource === 'bank_owner'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
              >
                <p className="font-bold">Rekening Bank / Owner</p>
                <p className="text-[10px] text-slate-500 font-normal">Tidak potong kas laci kasir</p>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keterangan / Catatan *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli es batu 2 sak dan galon air"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800"
            />
          </div>

          {/* Receipt Photo Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lampirkan Foto Nota / Struk (Opsional)
            </label>
            {receiptPhotoUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptPhotoUrl}
                  alt="Bukti Nota"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReceiptPhotoUrl('')}
                  aria-label="Hapus foto nota"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white text-xs hover:bg-rose-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
                <Camera className="w-5 h-5 text-slate-500 mb-1" />
                <span className="text-xs font-semibold text-slate-600">Ambil Foto / Unggah Nota</span>
                <span className="text-[10px] text-slate-500">JPG, PNG atau WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 flex items-center gap-1.5 ${entryType === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
            >
              <Check className="w-4 h-4" />
              <span>Simpan Catatan Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

