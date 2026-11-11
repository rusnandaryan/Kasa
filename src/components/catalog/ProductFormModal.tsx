'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { Product, Category, ProductVariantGroup } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';

interface ProductFormModalProps {
  product: Product | null;
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  categories,
  onClose,
  onSaved,
}) => {
  const { branding } = useAppStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [skuBarcode, setSkuBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [unitName, setUnitName] = useState('Pcs');
  const [allowDecimalQty, setAllowDecimalQty] = useState(false);
  const [isOpenPrice, setIsOpenPrice] = useState(false);
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQty, setStockQty] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [variantsConfig, setVariantsConfig] = useState<ProductVariantGroup[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // Temporary variant group builder state
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.categoryId);
      setSkuBarcode(product.skuBarcode || '');
      setSellingPrice(product.sellingPrice);
      setCostPrice(product.costPrice);
      setUnitName(product.unitName);
      setAllowDecimalQty(product.allowDecimalQty);
      setIsOpenPrice(product.isOpenPrice);
      setTrackInventory(product.trackInventory);
      setStockQty(product.stockQty);
      setLowStockThreshold(product.lowStockThreshold);
      setVariantsConfig(product.variantsConfig || []);
      setIsAvailable(product.isAvailable);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setSkuBarcode('');
      setSellingPrice(0);
      setCostPrice(0);
      setUnitName(branding.businessType === 'service' ? 'Sesi' : 'Pcs');
      setAllowDecimalQty(false);
      setIsOpenPrice(false);
      setTrackInventory(branding.businessType === 'retail');
      setStockQty(0);
      setLowStockThreshold(5);
      setVariantsConfig([]);
      setIsAvailable(true);
    }
  }, [product, categories, branding, isOpen]);

  if (!isOpen) return null;

  const handleAddVariantGroup = () => {
    if (!newGroupName.trim()) return;
    setVariantsConfig([
      ...variantsConfig,
      {
        groupName: newGroupName.trim(),
        required: false,
        options: [{ name: 'Standar', priceDelta: 0 }],
      },
    ]);
    setNewGroupName('');
  };

  const handleRemoveVariantGroup = (index: number) => {
    setVariantsConfig(variantsConfig.filter((_, i) => i !== index));
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    const updated = [...variantsConfig];
    updated[groupIndex].options.push({ name: 'Opsi Baru', priceDelta: 0 });
    setVariantsConfig(updated);
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    name: string,
    priceDelta: number
  ) => {
    const updated = [...variantsConfig];
    updated[groupIndex].options[optionIndex] = { name, priceDelta };
    setVariantsConfig(updated);
  };

  const handleRemoveOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...variantsConfig];
    updated[groupIndex].options.splice(optionIndex, 1);
    setVariantsConfig(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama item wajib diisi.');
      return;
    }
    if (!categoryId) {
      alert('Kategori wajib dipilih.');
      return;
    }

    const now = new Date().toISOString();

    if (product) {
      // Update
      await db.products.update(product.id, {
        name: name.trim(),
        categoryId,
        skuBarcode: skuBarcode.trim() || undefined,
        sellingPrice,
        costPrice,
        unitName,
        allowDecimalQty,
        isOpenPrice,
        trackInventory,
        stockQty,
        lowStockThreshold,
        variantsConfig,
        isAvailable,
        updatedAt: now,
      });
    } else {
      // Create
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        storeId: branding.id,
        name: name.trim(),
        categoryId,
        skuBarcode: skuBarcode.trim() || undefined,
        sellingPrice,
        costPrice,
        unitName,
        allowDecimalQty,
        isOpenPrice,
        trackInventory,
        stockQty,
        lowStockThreshold,
        variantsConfig,
        isAvailable,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      await db.products.add(newProd);
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {product ? `Edit ${branding.customTerminology.itemLabel}` : `Tambah ${branding.customTerminology.itemLabel} Baru`}
            </h3>
            <p className="text-xs text-slate-600">
              Kelola harga, modal (HPP), stok, dan varian
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form produk"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama {branding.customTerminology.itemLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Es Kopi Susu Gula Aren"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {branding.customTerminology.categoryLabel} *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Satuan Ukuran
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Pcs, Porsi, Kg, Cup, Jam"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Pricing: Selling Price & Cost Price (HPP) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Harga Jual (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-extrabold tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Harga Modal / HPP (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-extrabold tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {sellingPrice > 0 && costPrice > 0 && (
              <p className="text-[11px] text-emerald-700 font-semibold">
                Estimasi Laba Kotor: {formatRupiah(sellingPrice - costPrice)} per {unitName} ({Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)}%)
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isOpenPrice}
                  onChange={(e) => setIsOpenPrice(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span>Harga Fleksibel (Open Price)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allowDecimalQty}
                  onChange={(e) => setAllowDecimalQty(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span>Boleh Kuantitas Desimal (misal 1.5 Kg)</span>
              </label>
            </div>
          </div>

          {/* Barcode & Inventory Tracking */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode SKU / Barcode (Opsional)
              </label>
              <input
                type="text"
                value={skuBarcode}
                onChange={(e) => setSkuBarcode(e.target.value)}
                placeholder="Scan atau ketik barcode produk"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 placeholder:text-slate-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span>Lacak Pengurangan Stok Otomatis</span>
              </label>

              {trackInventory && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jumlah Stok Saat Ini
                    </label>
                    <input
                      type="number"
                      value={stockQty}
                      onChange={(e) => setStockQty(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-3 rounded-lg border border-amber-300 bg-white text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Batas Stok Menipis
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-3 rounded-lg border border-amber-300 bg-white text-xs font-bold tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variants / Modifiers Configuration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Varian / Topping Tambahan
              </label>
            </div>

            {/* List of Variant Groups */}
            {variantsConfig.map((grp, gIdx) => (
              <div key={gIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{grp.groupName}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddOptionToGroup(gIdx)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      + Tambah Pilihan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantGroup(gIdx)}
                      aria-label={`Hapus grup varian ${grp.groupName}`}
                      className="text-slate-500 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {grp.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => handleUpdateOption(gIdx, oIdx, e.target.value, opt.priceDelta)}
                        placeholder="Nama Opsi"
                        className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-500"
                      />
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-[10px] text-slate-500">+Rp</span>
                        <input
                          type="number"
                          value={opt.priceDelta || 0}
                          onChange={(e) =>
                            handleUpdateOption(gIdx, oIdx, opt.name, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold tabular-nums"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(gIdx, oIdx)}
                        aria-label={`Hapus pilihan opsi ${opt.name}`}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add new group bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Contoh: Ukuran, Level Pedas, Topping"
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddVariantGroup}
                className="px-3 h-9 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Grup Varian</span>
              </button>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span>Tersedia untuk Dijual di Kasir</span>
            </label>
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
              <span>Simpan {branding.customTerminology.itemLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

