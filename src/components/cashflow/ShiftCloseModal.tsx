'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Coins, PlayCircle } from 'lucide-react';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah, formatDateTime } from '@/core/formatters';
import { sound } from '@/core/sound';

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed: () => void;
}

export const ShiftCloseModal: React.FC<ShiftCloseModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
}) => {
  const { branding, activeMember, activeShift, refreshShift } = useAppStore();

  const [step, setStep] = useState<'reconcile' | 'next_shift'>('reconcile');
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [nextOpeningCash, setNextOpeningCash] = useState<number>(150000);
  const [cashSalesTotal, setCashSalesTotal] = useState<number>(0);
  const [cashExpenseTotal, setCashExpenseTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('reconcile');
    setNotes('');
    if (!activeShift) return;

    const calculateShiftTotals = async () => {
      setLoading(true);
      const shiftOrders = await db.orders
        .where('shiftId')
        .equals(activeShift.id)
        .filter((o) => o.paymentMethod === 'cash' && o.paymentStatus === 'paid')
        .toArray();

      const totalCashSales = shiftOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      const shiftExpenses = await db.cashflow
        .where('shiftId')
        .equals(activeShift.id)
        .filter((c) => c.entryType === 'expense' && c.fundSource === 'cash_drawer')
        .toArray();

      const totalCashExpenses = shiftExpenses.reduce((sum, c) => sum + c.amount, 0);

      setCashSalesTotal(totalCashSales);
      setCashExpenseTotal(totalCashExpenses);
      setActualCash(activeShift.openingCash + totalCashSales - totalCashExpenses);
      setLoading(false);
    };

    calculateShiftTotals();
  }, [isOpen, activeShift]);

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

  if (!isOpen || (!activeShift && step === 'reconcile')) return null;

  const expectedClosing = activeShift
    ? activeShift.openingCash + cashSalesTotal - cashExpenseTotal
    : 0;
  const cashDifference = actualCash - expectedClosing;

  const handleConfirmClose = async () => {
    if (!activeShift) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      await db.shifts.update(activeShift.id, {
        closedAt: now,
        expectedClosing,
        actualClosing: actualCash,
        cashDifference,
        notes: notes.trim() || undefined,
        status: 'closed',
      });

      await db.auditLogs.add({
        id: `audit-${Date.now()}`,
        storeId: branding.id,
        actorMemberId: activeMember.id,
        actorName: activeMember.fullName,
        action: 'SHIFT_CLOSED',
        description: `Tutup shift kasir: Seharusnya ${formatRupiah(expectedClosing)}, Aktual ${formatRupiah(actualCash)} (Selisih: ${formatRupiah(cashDifference)})`,
        createdAt: now,
      });

      sound.playSuccess();
      await refreshShift();
      setStep('next_shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNextShift = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      await db.shifts.add({
        id: `shift-${Date.now()}`,
        storeId: branding.id,
        cashierMemberId: activeMember.id,
        cashierName: activeMember.fullName,
        openedAt: now,
        openingCash: Math.max(0, nextOpeningCash),
        status: 'open',
      });
      sound.playBlip();
      await refreshShift();
      onShiftClosed();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishWithoutNextShift = () => {
    onShiftClosed();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-close-title"
      className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                step === 'reconcile'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {step === 'reconcile' ? (
                <Coins className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="shift-close-title" className="text-base font-bold text-slate-900">
                {step === 'reconcile' ? 'Tutup Shift Kasir' : 'Buka Shift Baru'}
              </h3>
              <p className="text-xs text-slate-600">
                {step === 'reconcile'
                  ? 'Rekonsiliasi uang fisik laci kasir'
                  : 'Shift sebelumnya tersimpan. Atur modal awal berikutnya.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={step === 'next_shift' ? handleFinishWithoutNextShift : onClose}
            aria-label="Tutup modal rekonsiliasi shift"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: RECONCILE CURRENT SHIFT */}
        {step === 'reconcile' && activeShift && (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Kasir Bertugas:</span>
                  <span className="font-bold text-slate-800">{activeShift.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu Buka Shift:</span>
                  <span className="tabular-nums text-slate-800">{formatDateTime(activeShift.openedAt)}</span>
                </div>
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl bg-slate-50/50">
                  Menghitung mutasi kas laci shift ini...
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Modal Awal Laci:</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatRupiah(activeShift.openingCash)}
                      </span>
                    </div>

                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>(+) Penjualan Tunai Shift Ini:</span>
                      <span className="tabular-nums">+{formatRupiah(cashSalesTotal)}</span>
                    </div>

                    <div className="flex justify-between text-rose-700 font-semibold">
                      <span>(-) Pengeluaran Kas Laci:</span>
                      <span className="tabular-nums">-{formatRupiah(cashExpenseTotal)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                      <span>Uang Seharusnya di Laci:</span>
                      <span className="tabular-nums text-blue-600">{formatRupiah(expectedClosing)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hitung Uang Fisik Aktual di Laci (Rp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={actualCash || ''}
                        onChange={(e) => setActualCash(parseInt(e.target.value, 10) || 0)}
                        placeholder="0"
                        autoFocus
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 text-lg font-extrabold tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {actualCash > 0 && (
                      <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">
                        Terbaca: {formatRupiah(actualCash)}
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                      cashDifference === 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : cashDifference > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {cashDifference === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-current shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">
                          {cashDifference === 0
                            ? 'Uang Kas Pas'
                            : cashDifference > 0
                            ? 'Selisih Lebih (Surplus)'
                            : 'Selisih Kurang (Minus)'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {cashDifference === 0
                            ? 'Perhitungan laci fisik sesuai persis dengan pembukuan'
                            : cashDifference > 0
                            ? 'Ada uang lebih di laci'
                            : 'Uang fisik kurang dari pembukuan sistem'}
                        </p>
                      </div>
                    </div>

                    <span className="text-base sm:text-lg font-black tabular-nums">
                      {cashDifference > 0 ? `+${formatRupiah(cashDifference)}` : formatRupiah(cashDifference)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Catatan Tutup Shift (Opsional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: uang receh kembalian cukup, shift lancar"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading || isSubmitting}
                onClick={handleConfirmClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Tutup Shift'}</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: OPEN NEXT SHIFT WITHOUT BROWSER PROMPT */}
        {step === 'next_shift' && (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Rekonsiliasi Shift Tersimpan!</p>
                  <p className="text-[11px] opacity-90">
                    Catatan kas akhir ({formatRupiah(actualCash)}) telah dicatat ke riwayat audit sistem.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Modal Awal Shift Berikutnya (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={nextOpeningCash || ''}
                    onChange={(e) => setNextOpeningCash(parseInt(e.target.value, 10) || 0)}
                    placeholder="150000"
                    autoFocus
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 text-lg font-extrabold tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {nextOpeningCash > 0 && (
                  <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">
                    Terbaca: {formatRupiah(nextOpeningCash)}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[100000, 150000, 200000, 300000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNextOpeningCash(preset)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 tabular-nums transition-colors"
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleFinishWithoutNextShift}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup Toko Saja
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleOpenNextShift}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--brand-primary, #2563EB)',
                  color: 'var(--brand-primary-text, #FFFFFF)',
                }}
              >
                <PlayCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Membuka...' : 'Buka Shift Baru'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
