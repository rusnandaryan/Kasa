'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '@/core/types';
import { formatRupiah } from '@/core/formatters';

interface VariantModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    selectedVariants: { groupName: string; optionName: string; priceDelta: number }[],
    notes: string,
    customPrice?: number
  ) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { optionName: string; priceDelta: number }>>({});
  const [notes, setNotes] = useState('');
  const [openPriceInput, setOpenPriceInput] = useState<number>(product?.sellingPrice || 0);

  if (!isOpen || !product) return null;

  const handleSelectOption = (groupName: string, optionName: string, priceDelta: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupName]: { optionName, priceDelta },
    }));
  };

  const deltaTotal = Object.values(selectedOptions).reduce((acc, curr) => acc + curr.priceDelta, 0);
  const basePrice = product.isOpenPrice ? openPriceInput : product.sellingPrice;
  const currentTotal = basePrice + deltaTotal;

  const handleAdd = () => {
    const formattedVariants = Object.entries(selectedOptions).map(([groupName, val]) => ({
      groupName,
      optionName: val.optionName,
      priceDelta: val.priceDelta,
    }));

    onConfirm(formattedVariants, notes, product.isOpenPrice ? openPriceInput : undefined);
    // Reset state
    setSelectedOptions({});
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{product.name}</h3>
            <p className="text-xs text-slate-500 font-semibold tabular-nums mt-0.5">
              {product.isOpenPrice ? 'Harga Fleksibel (Open Price)' : `Harga Dasar: ${formatRupiah(product.sellingPrice)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Open Price input if open price is enabled */}
          {product.isOpenPrice && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tentukan Harga Item (Rp)
              </label>
              <input
                type="number"
                value={openPriceInput || ''}
                onChange={(e) => setOpenPriceInput(parseInt(e.target.value, 10) || 0)}
                placeholder="Masukkan nominal harga"
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-lg font-bold tabular-nums text-slate-900"
              />
            </div>
          )}

          {/* Variants Groups */}
          {product.variantsConfig.map((group) => (
            <div key={group.groupName} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {group.groupName}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((opt) => {
                  const isSelected = selectedOptions[group.groupName]?.optionName === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleSelectOption(group.groupName, opt.name, opt.priceDelta)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <p className="truncate">{opt.name}</p>
                        {opt.priceDelta !== 0 && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            +{formatRupiah(opt.priceDelta)}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes per item */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pesanan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan terlalu pedas, pisahkan saus"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Subtotal Item</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
              {formatRupiah(currentTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 max-w-[200px] h-12 rounded-xl text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--brand-primary, #2563EB)',
              color: 'var(--brand-primary-text, #FFFFFF)',
            }}
          >
            + Tambah ke Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

