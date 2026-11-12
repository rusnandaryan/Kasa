'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Receipt,
  User,
  Hash,
  BookmarkPlus,
  Tag,
  Utensils,
  ShoppingBag,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import {
  formatOrderTypeLabel,
  formatRupiah,
  normalizeTableKey,
} from '@/core/formatters';

interface CartPanelProps {
  onOpenPayment: () => void;
  onOpenHoldModal: () => void;
  externalTableError?: string | null;
  onClearExternalTableError?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenPayment,
  onOpenHoldModal,
  externalTableError = null,
  onClearExternalTableError,
}) => {
  const {
    branding,
    cartItems,
    heldOrders,
    orderIdentifier,
    setOrderIdentifier,
    customerName,
    setCustomerInfo,
    activeOrderType,
    setActiveOrderType,
    toggleCartItemOrderType,
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
    mergeHeldOrderIntoCart,
    syncMatchingHeldOrderIntoCart,
  } = useAppStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [holdFeedbackMsg, setHoldFeedbackMsg] = useState<string | null>(null);
  const [localTableError, setLocalTableError] = useState<string | null>(null);
  const tableInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTableError = !orderIdentifier.trim()
    ? localTableError || externalTableError
    : null;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showTempFeedback = (message: string) => {
    setHoldFeedbackMsg(message);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setHoldFeedbackMsg(null);
    }, 3500);
  };

  const normalizedTableKey = normalizeTableKey(orderIdentifier);
  const matchingHold = normalizedTableKey
    ? heldOrders.find((h) => normalizeTableKey(h.orderIdentifier) === normalizedTableKey)
    : undefined;

  const requireTableNumber = (): boolean => {
    if (!orderIdentifier.trim()) {
      setLocalTableError('Nomor Meja wajib diisi sebelum menyimpan atau mencetak struk.');
      tableInputRef.current?.focus();
      return false;
    }
    setLocalTableError(null);
    onClearExternalTableError?.();
    return true;
  };

  const handleHoldOrder = () => {
    if (!requireTableNumber()) return;
    const result = holdCurrentOrder();
    if (!result) return;
    if (result.merged) {
      showTempFeedback(`Pesanan digabungkan ke ${result.tableLabel} (Pesanan Aktif).`);
    } else {
      showTempFeedback(`${result.tableLabel} disimpan ke Pesanan Aktif.`);
    }
  };

  const handleMergeMatchingNow = () => {
    if (!matchingHold) return;
    const label = matchingHold.orderIdentifier;
    mergeHeldOrderIntoCart(matchingHold.id);
    showTempFeedback(`Pesanan ${label} digabungkan ke daftar pesanan ini.`);
  };

  const handleOpenPayment = () => {
    if (!requireTableNumber()) return;
    syncMatchingHeldOrderIntoCart();
    onOpenPayment();
  };

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
              Daftar Pesanan
            </h3>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-blue-100 text-blue-700 shrink-0">
              {cartItems.reduce((acc, item) => acc + item.qty, 0)} item
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={onOpenHoldModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                title="Lihat daftar pesanan aktif"
              >
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Pesanan Aktif ({heldOrders.length})</span>
              </button>
            )}

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
        </div>

        {/* Table Number & Customer Name */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Hash className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${activeTableError ? 'text-rose-500' : 'text-slate-500'}`} />
              <input
                id="order-identifier-input"
                ref={tableInputRef}
                type="text"
                required
                value={orderIdentifier}
                onChange={(e) => {
                  setOrderIdentifier(e.target.value);
                  if (e.target.value.trim()) {
                    setLocalTableError(null);
                    onClearExternalTableError?.();
                  }
                }}
                placeholder="Nomor Meja *"
                aria-label="Nomor Meja wajib diisi"
                aria-invalid={Boolean(activeTableError)}
                className={`w-full h-9 pl-8 pr-2.5 rounded-lg border bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 placeholder:font-normal ${
                  activeTableError
                    ? 'border-rose-400 focus:ring-rose-500 placeholder:text-rose-400'
                    : 'border-slate-200 focus:ring-blue-500 placeholder:text-slate-500'
                }`}
              />
            </div>

            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerInfo(e.target.value, '')}
                placeholder="Nama Pelanggan"
                aria-label="Nama Pelanggan"
                className="w-full h-9 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 placeholder:font-normal"
              />
            </div>
          </div>

          {activeTableError && (
            <p className="text-[11px] font-semibold text-rose-600 px-0.5">
              {activeTableError}
            </p>
          )}
        </div>

        {/* Service Mode Toggle: Dine In / Take Away */}
        <div
          className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/70"
          role="group"
          aria-label="Tipe Pesanan"
        >
          <button
            type="button"
            onClick={() => setActiveOrderType('dine_in')}
            className={`h-8 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
              activeOrderType === 'dine_in'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveOrderType('take_away')}
            className={`h-8 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
              activeOrderType === 'take_away'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>
        </div>

        {/* Existing Table Active Order Auto-Merge Notice */}
        {matchingHold && (
          <div className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-900 truncate">
                {matchingHold.orderIdentifier} punya {matchingHold.items.length} pesanan aktif
              </p>
              <p className="text-[10px] text-amber-700 leading-tight">
                Simpan / Bayar otomatis gabung ke 1 struk
              </p>
            </div>
            <button
              type="button"
              onClick={handleMergeMatchingNow}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors"
            >
              <GitMerge className="w-3 h-3" />
              <span>Gabung</span>
            </button>
          </div>
        )}

        {/* Transient Hold/Merge Confirmation */}
        {holdFeedbackMsg && (
          <div className="px-2.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">{holdFeedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <Receipt className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700">Daftar Pesanan Masih Kosong</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Ketuk {branding.customTerminology.itemLabel.toLowerCase()} di sebelah kiri untuk menambahkan pesanan.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleCartItemOrderType(item.id)}
                      title="Klik untuk ubah Dine In / Take Away"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        item.orderType === 'take_away'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {item.orderType === 'take_away' ? (
                        <ShoppingBag className="w-2.5 h-2.5" />
                      ) : (
                        <Utensils className="w-2.5 h-2.5" />
                      )}
                      <span>{formatOrderTypeLabel(item.orderType)}</span>
                    </button>
                  </div>
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
                  aria-label={`Hapus ${item.name} dari keranjang`}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.id, item.qty - (item.allowDecimalQty ? 0.5 : 1))}
                    aria-label={`Kurangi jumlah ${item.name}`}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="w-12 text-center text-sm font-bold text-slate-900 tabular-nums">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    disabled={
                      item.maxStock !== undefined &&
                      cartItems
                        .filter((i) => i.productId === item.productId)
                        .reduce((sum, i) => sum + i.qty, 0) >= item.maxStock
                    }
                    onClick={() => updateCartItemQty(item.id, item.qty + (item.allowDecimalQty ? 0.5 : 1))}
                    aria-label={`Tambah jumlah ${item.name}`}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
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
              onClick={handleHoldOrder}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{matchingHold ? 'Gabung & Simpan' : 'Simpan Pesanan'}</span>
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
            <div className="flex items-center justify-between text-slate-600">
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
              <div className="flex items-center justify-between text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span>Pajak PB1 ({branding.taxPercentage}%)</span>
                </label>
                <span className="tabular-nums">{applyTax ? formatRupiah(taxAmount) : 'Rp 0'}</span>
              </div>
            )}

            {branding.serviceChargePct > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyService}
                    onChange={(e) => setApplyService(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
            onClick={handleOpenPayment}
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

            <span className="px-4 py-2 rounded-xl bg-white/20 text-xs sm:text-sm font-bold">
              Bayar [F8]
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

