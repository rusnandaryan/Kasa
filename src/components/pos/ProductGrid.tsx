'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Barcode, AlertCircle, Plus, SlidersHorizontal } from 'lucide-react';
import { Product, Category } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';
import { VariantModal } from './VariantModal';

export const ProductGrid: React.FC = () => {
  const { branding, addToCart } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);

  // Variant Modal
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const allCats = await db.categories.toArray();
    const cats = allCats
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const allProds = await db.products.toArray();
    const prods = allProds.filter((p) => !p.isArchived && p.isAvailable);

    setCategories(cats);
    setProducts(prods);
  };

  useEffect(() => {
    loadData();

    // Keyboard shortcuts (F2 for search focus)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategoryId === 'all' || prod.categoryId === selectedCategoryId;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        (prod.skuBarcode && prod.skuBarcode.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleProductClick = (product: Product) => {
    if ((product.variantsConfig && product.variantsConfig.length > 0) || product.isOpenPrice) {
      setSelectedProductForModal(product);
    } else {
      addToCart(product);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const match = products.find((p) => p.skuBarcode === barcodeInput);
    if (match) {
      handleProductClick(match);
      setBarcodeInput('');
      setIsBarcodeOpen(false);
    } else {
      alert(`Produk dengan barcode "${barcodeInput}" tidak ditemukan.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Search & Barcode Header */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${branding.customTerminology.itemLabel.toLowerCase()} atau ketik barcode... [F2]`}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-slate-800 transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Barcode Scanner Toggle */}
          <button
            type="button"
            onClick={() => setIsBarcodeOpen(!isBarcodeOpen)}
            aria-label="Buka scanner barcode"
            className={`h-11 px-3 sm:px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
              isBarcodeOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
            title="Scan / Input Barcode SKU"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">Barcode</span>
          </button>
        </div>

        {/* Barcode Quick Form Dropdown */}
        {isBarcodeOpen && (
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 animate-in fade-in duration-100">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan atau ketik kode barcode di sini, lalu tekan Enter"
              autoFocus
              className="flex-1 h-10 px-3 rounded-lg border border-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono"
            />
            <button
              type="submit"
              className="px-4 h-10 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Cari & Tambah
            </button>
          </form>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'shadow-2xs text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--brand-primary, #2563EB)',
                        color: 'var(--brand-primary-text, #FFFFFF)',
                      }
                    : undefined
                }
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Items Grid */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/50 flex items-center justify-center mb-3 text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {branding.customTerminology.itemLabel} tidak ditemukan
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Coba kata kunci lain atau pilih kategori &quot;Semua&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const hasVariants = product.variantsConfig && product.variantsConfig.length > 0;
              const isLowStock =
                product.trackInventory && product.stockQty <= product.lowStockThreshold;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="group relative bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-150 active:scale-[0.98] min-h-[110px] sm:min-h-[120px]"
                >
                  {/* Top: Name & Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      {hasVariants && (
                        <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          Varian
                        </span>
                      )}
                    </div>

                    {product.skuBarcode && (
                      <p className="text-[10px] font-mono text-slate-500 mb-1 truncate">
                        {product.skuBarcode}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Price & Stock */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                        {product.isOpenPrice ? 'Harga Fleksibel' : formatRupiah(product.sellingPrice)}
                      </p>
                      {product.trackInventory && (
                        <p
                          className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${
                            isLowStock ? 'text-amber-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {isLowStock && <AlertCircle className="w-3 h-3 text-amber-500" />}
                          <span>Stok: {product.stockQty} {product.unitName}</span>
                        </p>
                      )}
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Variant Modal */}
      <VariantModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        onConfirm={(selectedVariants, notes, customPrice) => {
          if (selectedProductForModal) {
            addToCart(selectedProductForModal, selectedVariants, notes, customPrice);
          }
        }}
      />
    </div>
  );
};

