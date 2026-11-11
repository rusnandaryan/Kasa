'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Percent,
  Receipt,
  User,
  Hash,
  PauseCircle,
  Tag,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';

interface CartPanelProps {
  onOpenPayment: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onOpenPayment }) => {
  const {
    branding,
    cartItems,
    orderIdentifier,
    setOrderIdentifier,
    customerName,
    customerPhone,
    setCustomerInfo,
    discountType,
    discountValue,
    setDiscount,
    applyTax,
    setApplyTax,
    applyService,
    setApplyService,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    holdCurrentOrder,
  } = useAppStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showCustomerInput, setShowCustomerInput] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(discountValue, subtotal);

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const serviceAmount = applyService
    ? Math.round((afterDiscount * branding.serviceChargePct) / 100)
    : 0;

  const taxAmount = applyTax
    ? Math.round(((afterDiscount + serviceAmount) * branding.taxPercentage) / 100)
    : 0;

  const grandTotal = afterDiscount + serviceAmount + taxAmount;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Cart Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Pesanan Aktif
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
              {cartItems.reduce((acc, item) => acc + item.qty, 0)} item
            </span>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded-md transition-colors"
              title="Kosongkan Pesanan"
            >
              Reset
            </button>
          )}
        </div>

        {/* Order Identifier & Customer toggle */}
        <div className="grid grid-cols-2 gap-2">
          {/* Order Identifier (Meja / Antrean / Plat) */}
          <div className="relative">
            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={orderIdentifier}
              onChange={(e) => setOrderIdentifier(e.target.value)}
              placeholder={branding.customTerminology.orderIdentifier || 'Nomor Meja'}
              className="w-full h-9 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Customer button/field */}
          <button
            type="button"
            onClick={() => setShowCustomerInput(!showCustomerInput)}
            className={`h-9 px-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
              customerName || customerPhone
                ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="truncate flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{customerName || 'Nama Pelanggan'}</span>
            </span>
            <span className="text-[10px] text-slate-400">Edit</span>
          </button>
        </div>

        {/* Expandable Customer Input Details */}
        {showCustomerInput && (
          <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 animate-in fade-in duration-100">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
              placeholder="Nama Lengkap Pelanggan"
              className="w-full h-8 px-2.5 rounded-md border border-blue-200 bg-white text-xs text-slate-800 focus:outline-hidden"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerInfo(customerName, e.target.value)}
              placeholder="Nomor WhatsApp (misal: 081234567890)"
              className="w-full h-8 px-2.5 rounded-md border border-blue-200 bg-white text-xs text-slate-800 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <Receipt className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Ketuk {branding.customTerminology.itemLabel.toLowerCase()} di sebelah kiri untuk menambahkan pesanan.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {item.name}
                  </h4>
                  {item.selectedVariants.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      {item.selectedVariants.map((v) => v.optionName).join(', ')}
                    </p>
                  )}
                  {item.itemNotes && (
                    <p className="text-[11px] text-amber-600 italic">
                      &quot;{item.itemNotes}&quot;
                    </p>
                  )}
                  <p className="text-xs text-slate-500 font-semibold tabular-nums mt-0.5">
                    {formatRupiah(item.unitPrice)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => removeCartItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Hapus item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.id, item.qty - (item.allowDecimalQty ? 0.5 : 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-12 text-center text-xs font-bold text-slate-900 tabular-nums">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.id, item.qty + (item.allowDecimalQty ? 0.5 : 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Bottom Summary & Checkout */}
      {cartItems.length > 0 && (
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/80 space-y-2.5">
          {/* Quick Actions: Hold Bill & Discount */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={holdCurrentOrder}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Parkir Pesanan</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-bold transition-colors ${
                discountValue > 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{discountValue > 0 ? `Diskon: ${discountType === 'percent' ? `${discountValue}%` : formatRupiah(discountValue)}` : 'Tambah Diskon'}</span>
            </button>
          </div>

          {/* Discount Editor Popover */}
          {showDiscountInput && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Diskon Transaksi</span>
                <div className="flex bg-slate-100 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDiscount('nominal', discountValue)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'nominal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Nominal (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscount('percent', discountValue)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'percent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Persen (%)
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => setDiscount(discountType, parseInt(e.target.value, 10) || 0)}
                  placeholder={discountType === 'percent' ? 'Contoh: 10 (%)' : 'Contoh: 5000 (Rp)'}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(false)}
                  className="px-3 h-9 bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Subtotal, Discount & Taxes summary */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-600 font-semibold">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            {branding.taxPercentage > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Pajak PB1 ({branding.taxPercentage}%)</span>
                </label>
                <span className="tabular-nums">{applyTax ? formatRupiah(taxAmount) : 'Rp 0'}</span>
              </div>
            )}

            {branding.serviceChargePct > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyService}
                    onChange={(e) => setApplyService(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Biaya Layanan ({branding.serviceChargePct}%)</span>
                </label>
                <span className="tabular-nums">{applyService ? formatRupiah(serviceAmount) : 'Rp 0'}</span>
              </div>
            )}
          </div>

          {/* Big Grand Total & Pay Button (min 56px touch target for tactile speed) */}
          <button
            type="button"
            onClick={onOpenPayment}
            className="w-full h-14 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-between px-4 sm:px-5 active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--brand-primary, #2563EB)',
              color: 'var(--brand-primary-text, #FFFFFF)',
            }}
          >
            <div className="text-left">
              <span className="text-[11px] uppercase tracking-wider block opacity-90 font-medium">
                Total Pembayaran
              </span>
              <span className="text-lg sm:text-xl font-extrabold tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            <span className="px-4 py-2 rounded-xl bg-white/20 text-xs sm:text-sm font-bold backdrop-blur-xs">
              Bayar [F8] →
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

