'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Briefcase } from 'lucide-react';
import { useAppStore } from '@/core/store';
import { CustomBusinessType } from '@/core/types';

interface CustomBusinessTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (type: CustomBusinessType) => void;
}

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Laundry Kiloan & Satuan',
    itemLabel: 'Layanan Cuci',
    categoryLabel: 'Kategori Layanan',
    orderIdentifier: 'Nomor Nota',
    defaultUnit: 'Kg',
    themeColor: '#0EA5E9',
  },
  {
    name: 'Bengkel & Servis Kendaraan',
    itemLabel: 'Sparepart & Jasa',
    categoryLabel: 'Kategori',
    orderIdentifier: 'Plat Kendaraan',
    defaultUnit: 'Pcs',
    themeColor: '#EA580C',
  },
  {
    name: 'Pet Shop & Perawatan Hewan',
    itemLabel: 'Produk & Grooming',
    categoryLabel: 'Kategori Produk',
    orderIdentifier: 'Nama Hewan / Pemilik',
    defaultUnit: 'Pcs',
    themeColor: '#8B5CF6',
  },
  {
    name: 'Cuci Mobil & Motor (Car Wash)',
    itemLabel: 'Paket Cuci',
    categoryLabel: 'Jenis Layanan',
    orderIdentifier: 'Plat Nomor',
    defaultUnit: 'Kendaraan',
    themeColor: '#2563EB',
  },
  {
    name: 'Apotek & Toko Obat',
    itemLabel: 'Obat & Alkes',
    categoryLabel: 'Golongan Obat',
    orderIdentifier: 'Nomor Antrean',
    defaultUnit: 'Pcs',
    themeColor: '#059669',
  },
  {
    name: 'Percetakan & Fotokopi',
    itemLabel: 'Produk Cetak',
    categoryLabel: 'Kategori Cetak',
    orderIdentifier: 'Nomor Nota / Antrean',
    defaultUnit: 'Lembar',
    themeColor: '#D97706',
  },
];

export const CustomBusinessTypeModal: React.FC<CustomBusinessTypeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { addCustomBusinessType } = useAppStore();

  const [name, setName] = useState('');
  const [itemLabel, setItemLabel] = useState('Produk / Layanan');
  const [categoryLabel, setCategoryLabel] = useState('Kategori');
  const [orderIdentifier, setOrderIdentifier] = useState('Nomor Meja');
  const [defaultUnit, setDefaultUnit] = useState('Pcs');
  const [themeColor, setThemeColor] = useState('#2563EB');
  const [catalogOption, setCatalogOption] = useState<'keep' | 'none' | 'fnb' | 'retail' | 'service'>('keep');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleApplyTemplate = (tmpl: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setName(tmpl.name);
    setItemLabel(tmpl.itemLabel);
    setCategoryLabel(tmpl.categoryLabel);
    setOrderIdentifier(tmpl.orderIdentifier);
    setDefaultUnit(tmpl.defaultUnit);
    setThemeColor(tmpl.themeColor);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Nama jenis usaha wajib diisi.');
      return;
    }

    const customId = `custom-${Date.now()}`;
    const newCustomType: CustomBusinessType = {
      id: customId,
      name: trimmedName,
      itemLabel: itemLabel.trim() || 'Produk',
      categoryLabel: categoryLabel.trim() || 'Kategori',
      orderIdentifier: orderIdentifier.trim() || 'Nomor Nota',
      defaultUnit: defaultUnit.trim() || 'Pcs',
      themeColor,
    };

    const presetOption = catalogOption === 'keep' ? undefined : catalogOption;
    await addCustomBusinessType(newCustomType, { catalogPreset: presetOption });
    onSaved?.(newCustomType);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-business-type-title"
      className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 id="custom-business-type-title" className="text-base font-bold text-slate-900">
                Tambah Jenis Usaha Kustom
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan istilah kasir dan identitas transaksi untuk bisnis Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form jenis usaha"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Quick Template Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pilih Cepat Rekomendasi (Opsional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_SUGGESTIONS.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleApplyTemplate(t)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {t.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Business Type Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Jenis Usaha *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setErrorMsg('');
              }}
              placeholder="Contoh: Laundry Kiloan, Bengkel Motor, Pet Shop"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Terminology Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Label Item / Produk
              </label>
              <input
                type="text"
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
                placeholder="Contoh: Layanan, Menu, Produk, Obat"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Label Kategori
              </label>
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="Contoh: Kategori, Golongan"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Identitas Pesanan / Meja
              </label>
              <input
                type="text"
                value={orderIdentifier}
                onChange={(e) => setOrderIdentifier(e.target.value)}
                placeholder="Contoh: Nomor Meja, Plat Kendaraan, Nomor Nota"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Satuan Ukuran Default
              </label>
              <input
                type="text"
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value)}
                placeholder="Contoh: Pcs, Kg, Sesi, Jam, Lembar"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Warna Tema Aksen Usaha
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
              />
              <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                {themeColor}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                {['#2563EB', '#059669', '#EA580C', '#8B5CF6', '#D97706'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setThemeColor(hex)}
                    className="w-6 h-6 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Initial Catalog Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilihan Isi Katalog Awal
            </label>
            <div className="space-y-1.5 text-xs text-slate-700">
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="radio"
                  name="catalogOption"
                  checked={catalogOption === 'keep'}
                  onChange={() => setCatalogOption('keep')}
                  className="rounded-full text-blue-600"
                />
                <span className="font-semibold">Pertahankan daftar katalog saat ini</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="radio"
                  name="catalogOption"
                  checked={catalogOption === 'none'}
                  onChange={() => setCatalogOption('none')}
                  className="rounded-full text-blue-600"
                />
                <span className="font-semibold">Mulai dengan katalog bersih / kosong</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="radio"
                  name="catalogOption"
                  checked={catalogOption === 'retail'}
                  onChange={() => setCatalogOption('retail')}
                  className="rounded-full text-blue-600"
                />
                <span>Salin contoh katalog Toko / Retail (Barcode &amp; Stok)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="radio"
                  name="catalogOption"
                  checked={catalogOption === 'service'}
                  onChange={() => setCatalogOption('service')}
                  className="rounded-full text-blue-600"
                />
                <span>Salin contoh katalog Jasa / Servis (Staf &amp; Durasi)</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan &amp; Terapkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
