'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Layers } from 'lucide-react';
import { Category } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';

interface CategoryFormModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const COLOR_PRESETS = [
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#0F172A',
  '#64748B',
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  category,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { branding } = useAppStore();

  const [name, setName] = useState(category?.name ?? '');
  const [colorBadge, setColorBadge] = useState(category?.colorBadge || '#3B82F6');
  const [sortOrder, setSortOrder] = useState<number>(category?.sortOrder || 0);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (category) {
      await db.categories.update(category.id, {
        name: trimmed,
        colorBadge,
        sortOrder: sortOrder || category.sortOrder,
        isActive,
      });
    } else {
      await db.categories.add({
        id: `cat-${Date.now()}`,
        storeId: branding.id,
        name: trimmed,
        colorBadge,
        sortOrder: sortOrder || 999,
        isActive,
      });
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
              style={{ backgroundColor: `${colorBadge}1A`, color: colorBadge }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {category ? `Edit ${branding.customTerminology.categoryLabel}` : `Tambah ${branding.customTerminology.categoryLabel} Baru`}
              </h3>
              <p className="text-xs text-slate-600">
                Kelola pengelompokan {branding.customTerminology.itemLabel.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form kategori"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama {branding.customTerminology.categoryLabel} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Contoh: ${branding.customTerminology.categoryLabel === 'Kategori' ? 'Minuman Panas' : branding.customTerminology.categoryLabel}`}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800"
            />
          </div>

          {/* Color Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Warna Penanda
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColorBadge(hex)}
                  aria-label={`Pilih warna ${hex}`}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    colorBadge.toLowerCase() === hex.toLowerCase()
                      ? 'border-slate-900 scale-110 shadow-xs'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <label className="relative w-8 h-8 rounded-lg border border-dashed border-slate-300 cursor-pointer overflow-hidden" title="Pilih warna bebas">
                <input
                  type="color"
                  value={colorBadge}
                  onChange={(e) => setColorBadge(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: colorBadge }}
                >
                  +
                </span>
              </label>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{colorBadge}</span>
            </div>
          </div>

          {/* Sort Order & Active */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Urutan Tampil
              </label>
              <input
                type="number"
                min="1"
                value={sortOrder || ''}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                placeholder="1"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums text-slate-800"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span>Tampilkan di Kasir</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--brand-primary, #2563EB)',
                color: 'var(--brand-primary-text, #FFFFFF)',
              }}
            >
              <Check className="w-4 h-4" />
              <span>Simpan {branding.customTerminology.categoryLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
