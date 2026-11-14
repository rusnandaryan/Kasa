'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Search,
  Edit2,
  Trash2,
  Layers,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Product, Category } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';
import { ProductFormModal } from './ProductFormModal';
import { CategoryFormModal } from './CategoryFormModal';

export const CatalogManager: React.FC = () => {
  const { branding, activeMember } = useAppStore();
  const isCashier = activeMember.role === 'cashier';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadData = async () => {
    const allCats = await db.categories.toArray();
    const cats = allCats
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const allProds = await db.products.toArray();
    const prods = allProds.filter((p) => !p.isArchived);

    setCategories(cats);
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, []);


  const handleDeleteCategory = async (catId: string) => {
    if (confirm('Hapus kategori ini? Item di dalam kategori ini tidak akan terhapus.')) {
      await db.categories.delete(catId);
      loadData();
    }
  };

  const handleToggleProductAvailability = async (prod: Product) => {
    await db.products.update(prod.id, {
      isAvailable: !prod.isAvailable,
      updatedAt: new Date().toISOString(),
    });
    window.dispatchEvent(new CustomEvent('kasa:products-updated'));
    loadData();
  };

  const handleAdjustStock = async (prod: Product, delta: number) => {
    const step = prod.allowDecimalQty ? delta * 0.5 : delta;
    const nextStock = Math.max(0, Math.round((prod.stockQty + step) * 100) / 100);
    await db.products.update(prod.id, {
      stockQty: nextStock,
      updatedAt: new Date().toISOString(),
    });
    window.dispatchEvent(new CustomEvent('kasa:products-updated'));
    loadData();
  };

  const handleArchiveProduct = async (prodId: string) => {
    if (confirm('Arsipkan item ini dari kasir? Riwayat transaksi lama tetap aman.')) {
      await db.products.update(prodId, {
        isArchived: true,
        updatedAt: new Date().toISOString(),
      });
      loadData();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.skuBarcode && p.skuBarcode.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Katalog {branding.customTerminology.itemLabel} & Stok
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur daftar menu/produk, harga jual, harga modal (HPP), varian rasa, dan batas minimum stok.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Category Button (Admin/Owner only) */}
            {!isCashier && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--brand-primary, #2563EB)',
                  color: 'var(--brand-primary-text, #FFFFFF)',
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah {branding.customTerminology.categoryLabel}</span>
              </button>
            )}

            {/* Add Product Button (Admin/Owner only) */}
            {!isCashier && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--brand-primary, #2563EB)',
                  color: 'var(--brand-primary-text, #FFFFFF)',
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah {branding.customTerminology.itemLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Kelola {branding.customTerminology.categoryLabel}</span>
            </span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCatId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCatId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`inline-flex items-center rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCatId(cat.id)}
                    className="px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.colorBadge || '#64748B' }}
                    />
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                  {!isCashier && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        aria-label={`Edit kategori ${cat.name}`}
                        className={`pr-1 ${isSelected ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-blue-600'}`}
                        title="Edit kategori"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        aria-label={`Hapus kategori ${cat.name}`}
                        className={`pr-2 ${isSelected ? 'text-white/70 hover:text-rose-200' : 'text-slate-400 hover:text-rose-500'}`}
                        title="Hapus kategori"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Product Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-200">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama atau kode barcode..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Item</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Harga Modal (HPP)</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  <th className="py-3 px-4 text-center">Tersedia</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Belum ada {branding.customTerminology.itemLabel.toLowerCase()} terdaftar.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const isLowStock = p.trackInventory && p.stockQty <= p.lowStockThreshold;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>
                            <p className="text-slate-900">{p.name}</p>
                            {p.skuBarcode && (
                              <p className="text-[10px] font-mono text-slate-500">{p.skuBarcode}</p>
                            )}
                            {p.variantsConfig && p.variantsConfig.length > 0 && (
                              <p className="text-[10px] text-amber-600 font-medium">
                                {p.variantsConfig.length} Grup Varian
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {cat?.name || 'Tanpa Kategori'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                          {p.isOpenPrice ? 'Harga Fleksibel' : formatRupiah(p.sellingPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums font-semibold">
                          {p.costPrice > 0 ? formatRupiah(p.costPrice) : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {p.trackInventory ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, -1)}
                                disabled={p.stockQty <= 0}
                                aria-label={`Kurangi stok ${p.name}`}
                                className="w-6 h-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums min-w-[64px] justify-center ${
                                  p.stockQty <= 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isLowStock && <AlertCircle className="w-3 h-3 text-amber-600" />}
                                <span>{p.stockQty} {p.unitName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(p, 1)}
                                aria-label={`Tambah stok ${p.name}`}
                                className="w-6 h-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Selalu Ada</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProductAvailability(p)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              p.isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {p.isAvailable ? 'Aktif' : 'Habis'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              aria-label={`Edit ${p.name}`}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Stok & Detail Menu"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isCashier && (
                              <button
                                type="button"
                                onClick={() => handleArchiveProduct(p.id)}
                                aria-label={`Arsipkan ${p.name}`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Arsipkan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        categories={categories}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={loadData}
      />

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <CategoryFormModal
          category={editingCategory}
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSaved={loadData}
        />
      )}
    </div>
  );
};

