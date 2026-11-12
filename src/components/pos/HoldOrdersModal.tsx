'use client';

import React, { useEffect } from 'react';
import { X, Clock, Play, Trash2 } from 'lucide-react';
import { useAppStore } from '@/core/store';
import { formatRupiah, formatTimeOnly } from '@/core/formatters';

interface HoldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoldOrdersModal: React.FC<HoldOrdersModalProps> = ({ isOpen, onClose }) => {
  const { heldOrders, restoreHeldOrder, deleteHeldOrder } = useAppStore();

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Pesanan Aktif ({heldOrders.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pesanan aktif"
            className="p-1 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
          {heldOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Tidak ada pesanan aktif yang tersimpan.
            </p>
          ) : (
            heldOrders.map((h) => {
              const dineInQty = h.items
                .filter((i) => i.orderType !== 'take_away')
                .reduce((sum, i) => sum + i.qty, 0);
              const takeAwayQty = h.items
                .filter((i) => i.orderType === 'take_away')
                .reduce((sum, i) => sum + i.qty, 0);

              return (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {h.customerName}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {h.orderIdentifier}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dineInQty > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {dineInQty} Dine In
                        </span>
                      )}
                      {takeAwayQty > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {takeAwayQty} Take Away
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {h.items.length} baris • Disimpan pukul {formatTimeOnly(h.heldAt)}
                    </p>
                    <p className="text-xs font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(h.total)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        restoreHeldOrder(h.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Lanjutkan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteHeldOrder(h.id)}
                      aria-label="Hapus pesanan aktif"
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Hapus Pesanan Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

