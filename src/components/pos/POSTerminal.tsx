'use client';

import React, { useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { Order } from '@/core/types';
import { useAppStore } from '@/core/store';
import { ShoppingCart } from 'lucide-react';
import { formatRupiah } from '@/core/formatters';

export const POSTerminal: React.FC = () => {
  const { cartItems } = useAppStore();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

  const handlePaymentSuccess = (order: Order) => {
    setIsPaymentOpen(false);
    setCompletedOrder(order);
    setIsReceiptOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.qty, 0);
  const totalCartAmount = cartItems.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] min-h-[500px] overflow-hidden relative">
      {/* Desktop / Tablet Split Screen (65% Products / 35% Cart) */}
      <div className="flex-1 hidden md:grid md:grid-cols-12 h-full overflow-hidden">
        <div className="md:col-span-7 lg:col-span-8 h-full overflow-hidden">
          <ProductGrid />
        </div>
        <div className="md:col-span-5 lg:col-span-4 h-full overflow-hidden">
          <CartPanel onOpenPayment={() => setIsPaymentOpen(true)} />
        </div>
      </div>

      {/* Mobile Single View Toggle */}
      <div className="flex-1 md:hidden h-full overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {mobileView === 'catalog' ? (
            <ProductGrid />
          ) : (
            <CartPanel onOpenPayment={() => setIsPaymentOpen(true)} />
          )}
        </div>

        {/* Floating Mobile Cart Bar */}
        {mobileView === 'catalog' && cartItems.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMobileView('cart')}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-between px-4 shadow-md active:scale-98"
              style={{
                backgroundColor: 'var(--brand-primary, #2563EB)',
                color: 'var(--brand-primary-text, #FFFFFF)',
              }}
            >
              <div className="flex items-center gap-2 text-xs">
                <ShoppingCart className="w-4 h-4" />
                <span>Lihat Pesanan ({totalCartCount} item)</span>
              </div>
              <span className="text-sm font-extrabold tabular-nums">
                {formatRupiah(totalCartAmount)}
              </span>
            </button>
          </div>
        )}

        {/* Mobile back to catalog button */}
        {mobileView === 'cart' && (
          <div className="p-2.5 bg-slate-100 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setMobileView('catalog')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              ← Kembali Tambah Menu Lain
            </button>
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={completedOrder}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedOrder(null);
          setMobileView('catalog');
        }}
      />
    </div>
  );
};

