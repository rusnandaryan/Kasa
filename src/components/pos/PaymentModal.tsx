'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PaymentMethod, Order } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah, generateInvoiceNumber } from '@/core/formatters';
import { sound } from '@/core/sound';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const {
    branding,
    cartItems,
    orderIdentifier,
    customerName,
    customerPhone,
    discountType,
    discountValue,
    applyTax,
    applyService,
    activeMember,
    activeShift,
    clearCart,
  } = useAppStore();

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [debtDueDate, setDebtDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = useMemo(() => cartItems.reduce((acc, i) => acc + i.subtotal, 0), [cartItems]);

  const discountAmount = useMemo(() => {
    return discountType === 'percent'
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const serviceAmount = applyService
    ? Math.round((afterDiscount * branding.serviceChargePct) / 100)
    : 0;

  const taxAmount = applyTax
    ? Math.round(((afterDiscount + serviceAmount) * branding.taxPercentage) / 100)
    : 0;

  const grandTotal = afterDiscount + serviceAmount + taxAmount;

  // Total HPP (Cost of Goods Sold)
  const totalCost = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.costPrice * item.qty, 0);
  }, [cartItems]);

  // Suggested Quick Cash amounts
  const quickCashOptions = useMemo(() => {
    const list: { label: string; value: number }[] = [{ label: 'Uang Pas', value: grandTotal }];
    const targets = [10000, 20000, 50000, 100000, 200000, 500000];

    targets.forEach((amt) => {
      if (amt > grandTotal && !list.some((x) => x.value === amt)) {
        list.push({ label: formatRupiah(amt), value: amt });
      }
    });

    return list.slice(0, 5);
  }, [grandTotal]);

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

  const effectiveCash = method === 'cash' ? cashReceived : grandTotal;
  const changeAmount = Math.max(0, effectiveCash - grandTotal);
  const isCashInsufficient = method === 'cash' && cashReceived < grandTotal;

  const handleQuickCash = (amt: number) => {
    setCashReceived(amt);
  };

  const handleCompletePayment = async () => {
    if (isCashInsufficient) {
      alert('Uang yang diterima kurang dari total belanja.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const invoiceNum = generateInvoiceNumber();

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        storeId: branding.id,
        shiftId: activeShift?.id,
        cashierMemberId: activeMember.id,
        cashierName: activeMember.fullName,
        invoiceNumber: invoiceNum,
        customerName: customerName || 'Pelanggan Umum',
        customerPhone: customerPhone || undefined,
        orderIdentifier: orderIdentifier || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          unitCost: item.costPrice,
          unitName: item.unitName,
          variantsSelected: item.selectedVariants,
          itemNotes: item.itemNotes,
          subtotalItem: item.subtotal,
        })),
        subtotal,
        discountAmount,
        discountPercent: discountType === 'percent' ? discountValue : undefined,
        taxAmount,
        serviceAmount,
        totalAmount: grandTotal,
        totalCostAmount: totalCost,
        paymentMethod: method,
        amountReceived: effectiveCash,
        changeAmount,
        paymentStatus: method === 'debt' ? 'debt' : 'paid',
        syncedFromOffline: true,
        createdAt: now,
      };

      // 1. Save order in Dexie
      await db.orders.add(newOrder);

      // 2. Automatically log Cashflow income
      const fundSource = method === 'cash' ? 'cash_drawer' : 'bank_owner';
      await db.cashflow.add({
        id: `cf-${Date.now()}`,
        storeId: branding.id,
        shiftId: activeShift?.id,
        referenceOrderId: newOrder.id,
        createdBy: activeMember.id,
        creatorName: activeMember.fullName,
        entryType: 'income',
        category: 'Penjualan Kasir',
        fundSource,
        amount: grandTotal,
        description: `Penjualan ${invoiceNum} (${method.toUpperCase()})`,
        transactionDate: now,
        createdAt: now,
      });

      // 3. Decrement product stock if tracked
      for (const item of cartItems) {
        const prod = await db.products.get(item.productId);
        if (prod && prod.trackInventory) {
          const newStock = Math.max(0, prod.stockQty - item.qty);
          await db.products.update(item.productId, {
            stockQty: newStock,
            updatedAt: now,
          });
        }
      }

      clearCart();
      sound.playSuccess();
      setIsSubmitting(false);
      onPaymentSuccess(newOrder);
    } catch (err) {
      console.error('Failed to complete payment:', err);
      alert('Gagal memproses pembayaran. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-600">Pilih metode pembayaran dan hitung kembalian</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pembayaran"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 text-center">
          <span className="text-xs text-slate-300 uppercase tracking-widest font-semibold block mb-0.5">
            Total Tagihan
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white">
            {formatRupiah(grandTotal)}
          </span>
          {orderIdentifier && (
            <p className="text-xs text-blue-300 font-medium mt-1">
              {branding.customTerminology.orderIdentifier}: {orderIdentifier}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'cash', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Transfer', icon: CreditCard },
                { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
                { id: 'debt', label: 'Kasbon', icon: Clock },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id as PaymentMethod);
                      if (m.id !== 'cash') setCashReceived(grandTotal);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs font-bold'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH: Quick Money keypad & Change Calculation */}
          {method === 'cash' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    autoFocus
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-lg font-extrabold tabular-nums text-slate-900"
                  />
                </div>
                {cashReceived > 0 && (
                  <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">
                    Terbaca: {formatRupiah(cashReceived)}
                  </p>
                )}
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleQuickCash(opt.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-bold text-slate-700 transition-colors tabular-nums"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Kembalian (Change) Box */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {isCashInsufficient ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Kurang Bayar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Uang Kembalian</span>
                      </>
                    )}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold tabular-nums">
                    {formatRupiah(isCashInsufficient ? grandTotal - cashReceived : changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* QRIS Display Mode */}
          {method === 'qris' && (
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col items-center text-center space-y-2">
              <div className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-800" />
                <span className="text-[9px] font-bold tracking-widest text-slate-500 mt-1 uppercase">
                  QRIS STANDAR INDONESIA
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Arahkan pelanggan scan QRIS dengan GoPay, OVO, Dana, BCA, atau Livin
              </p>
              <p className="text-[11px] text-slate-600">
                Konfirmasi transaksi berhasil setelah notifikasi pembayaran masuk.
              </p>
            </div>
          )}

          {/* Transfer Bank Mode */}
          {method === 'transfer' && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Rekening Toko:</p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <p className="font-mono font-bold text-slate-900">BCA: 8830-1234-5678</p>
                <p className="text-slate-600">a.n. {branding.brandName}</p>
              </div>
              <p className="text-slate-500 text-[11px]">
                Pastikan bukti transfer telah diperiksa kasir sebelum menyelesaikan transaksi.
              </p>
            </div>
          )}

          {/* Debt / Kasbon Mode */}
          {method === 'debt' && (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 space-y-2 text-xs">
              <p className="font-bold text-amber-900">Pencatatan Piutang / Kasbon:</p>
              <p className="text-amber-800 text-[11px]">
                Pelanggan: <strong className="text-slate-900">{customerName || 'Belum diisi nama pelanggan'}</strong>
              </p>
              <input
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-amber-300 bg-white text-xs"
                placeholder="Janji tanggal bayar"
              />
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSubmitting || isCashInsufficient}
            onClick={handleCompletePayment}
            className={`flex-1 h-12 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
              isCashInsufficient
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'text-white hover:opacity-90 active:scale-95'
            }`}
            style={
              !isCashInsufficient
                ? {
                    backgroundColor: 'var(--brand-primary, #2563EB)',
                    color: 'var(--brand-primary-text, #FFFFFF)',
                  }
                : undefined
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesaikan & Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

