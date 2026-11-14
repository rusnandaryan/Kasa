'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Palette,
  Store,
  Receipt,
  Upload,
  Check,
  Briefcase,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import { sound } from '@/core/sound';
import { BusinessType } from '@/core/types';
import { formatRupiah } from '@/core/formatters';
import { CustomBusinessTypeModal } from './CustomBusinessTypeModal';

export const SettingsBranding: React.FC = () => {
  const {
    branding,
    updateBranding,
    applyBusinessPreset,
    deleteCustomBusinessType,
  } = useAppStore();

  const [brandName, setBrandName] = useState(branding.brandName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [address, setAddress] = useState(branding.address);
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(branding.phoneWhatsapp);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [themeColor, setThemeColor] = useState(branding.themeColor);
  const [taxPercentage, setTaxPercentage] = useState(branding.taxPercentage);
  const [serviceChargePct, setServiceChargePct] = useState(branding.serviceChargePct);

  // Terminology
  const [itemLabel, setItemLabel] = useState(branding.customTerminology.itemLabel);
  const [categoryLabel, setCategoryLabel] = useState(branding.customTerminology.categoryLabel);
  const [orderIdentifier, setOrderIdentifier] = useState(branding.customTerminology.orderIdentifier);

  // Receipt
  const [headerText, setHeaderText] = useState(branding.receiptConfig.headerText);
  const [footerText, setFooterText] = useState(branding.receiptConfig.footerText);
  const [showLogo, setShowLogo] = useState(branding.receiptConfig.showLogo);
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(branding.receiptConfig.paperSize);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(() => sound.getMuted());

  const themePresets = [
    { name: 'Royal Blue (Trust)', hex: '#2563EB' },
    { name: 'Kopi Amber (Hangat)', hex: '#D97706' },
    { name: 'Hijau Segar (Retail)', hex: '#059669' },
    { name: 'Merah Kuliner (Resto)', hex: '#E11D48' },
    { name: 'Dark Slate (Barber & Jasa)', hex: '#0F172A' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBranding({
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phoneWhatsapp: phoneWhatsapp.trim(),
      logoUrl,
      themeColor,
      taxPercentage,
      serviceChargePct,
      customTerminology: {
        itemLabel: itemLabel.trim() || 'Menu',
        categoryLabel: categoryLabel.trim() || 'Kategori',
        orderIdentifier: orderIdentifier.trim() || 'Nomor Meja',
      },
      receiptConfig: {
        ...branding.receiptConfig,
        headerText: headerText.trim(),
        footerText: footerText.trim(),
        showLogo,
        paperSize,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleChangePreset = async (preset: BusinessType) => {
    if (confirm('Ubah jenis usaha? Istilah dan pengaturan aplikasi akan disesuaikan.')) {
      await applyBusinessPreset(preset);
      // Update local inputs
      const updated = useAppStore.getState().branding;
      setItemLabel(updated.customTerminology.itemLabel);
      setCategoryLabel(updated.customTerminology.categoryLabel);
      setOrderIdentifier(updated.customTerminology.orderIdentifier);
      setThemeColor(updated.themeColor);
    }
  };

  const handleDeleteCustomType = async (e: React.MouseEvent, typeId: string, typeName: string) => {
    e.stopPropagation();
    if (confirm(`Hapus jenis usaha kustom "${typeName}"?`)) {
      await deleteCustomBusinessType(typeId);
      const updated = useAppStore.getState().branding;
      setItemLabel(updated.customTerminology.itemLabel);
      setCategoryLabel(updated.customTerminology.categoryLabel);
      setOrderIdentifier(updated.customTerminology.orderIdentifier);
      setThemeColor(updated.themeColor);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Identitas Brand Toko & Kustomisasi White-Label
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Ubah logo, nama brand, warna tema, dan pratinjau struk thermal secara real-time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-2 self-start sm:self-auto"
            style={{
              backgroundColor: 'var(--brand-primary, #2563EB)',
              color: 'var(--brand-primary-text, #FFFFFF)',
            }}
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Identitas brand dan tema warna berhasil disimpan seketika!</span>
          </div>
        )}

        {/* Split Screen Layout: Form Kiri & Live Preview Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Forms (7 cols) */}
          <form onSubmit={handleSaveAll} className="lg:col-span-7 space-y-5">
            {/* 1. Brand Profile & Logo */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Profil Usaha & Logo Resmi</span>
              </h3>

              {/* Logo Upload & Preview */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center group">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={brandName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="font-bold text-2xl text-slate-500">
                      {brandName.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Logo Aplikasi (*.jpg, PNG, WebP)</p>
                  <p className="text-[11px] text-slate-500">
                    Otomatis tampil di Header aplikasi, login kasir, dan struk cetak thermal.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 transition-colors mt-1">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti Gambar Logo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Brand Toko / Usaha *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Contoh: Kopi Asli Nusantara"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp Toko
                  </label>
                  <input
                    type="tel"
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Toko (Struk)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Pemuda No. 45"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 2. Dynamic Color & Theme */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Warna Tema Brand UMKM (Dynamic Token)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {themePresets.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => {
                      setThemeColor(preset.hex);
                      useAppStore.getState().applyThemeCssVars(preset.hex);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${themeColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-slate-900 bg-slate-50 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg shadow-inner border border-black/10"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] text-center line-clamp-1">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-600">Pilih Warna Bebas (Hex):</span>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => {
                    setThemeColor(e.target.value);
                    useAppStore.getState().applyThemeCssVars(e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => {
                    setThemeColor(e.target.value);
                    if (e.target.value.length === 7) {
                      useAppStore.getState().applyThemeCssVars(e.target.value);
                    }
                  }}
                  className="w-24 h-8 px-2 rounded-lg border border-slate-200 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            {/* 3. Jenis Usaha & Kustomisasi Istilah */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Jenis Usaha
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Tambah jenis usaha kustom baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Jenis Usaha</span>
                </button>
              </div>

              {/* Dropdown Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pilih Jenis Usaha Aktif
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={branding.businessType}
                    onChange={(e) => handleChangePreset(e.target.value as BusinessType)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <optgroup label="Preset Bawaan">
                      <option value="fnb">☕ Kuliner / Kafe &amp; F&amp;B (Meja &amp; Varian)</option>
                      <option value="retail">🛒 Toko Sembako / Retail (Barcode &amp; Stok)</option>
                      <option value="service">✂️ Jasa Layanan / Servis (Staf &amp; Durasi)</option>
                    </optgroup>
                    {(branding.customBusinessTypes || []).length > 0 && (
                      <optgroup label="Jenis Usaha Kustom">
                        {(branding.customBusinessTypes || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            🏷️ {c.name} ({c.itemLabel})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="h-10 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                    title="Tambah Jenis Usaha Baru (+)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Baru</span>
                  </button>
                </div>
              </div>

              {/* Visual Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { id: 'fnb', label: 'Kuliner / F&B', desc: 'Meja & Varian' },
                  { id: 'retail', label: 'Toko / Retail', desc: 'Barcode & Stok' },
                  { id: 'service', label: 'Jasa / Layanan', desc: 'Staf & Durasi' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleChangePreset(type.id as BusinessType)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${branding.businessType === type.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                  >
                    <p className="truncate">{type.label}</p>
                    <p className="text-[10px] text-slate-500 font-normal">{type.desc}</p>
                  </button>
                ))}

                {(branding.customBusinessTypes || []).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleChangePreset(c.id as BusinessType)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer relative group flex flex-col justify-between ${branding.businessType === c.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="truncate pr-4">{c.name}</p>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomType(e, c.id, c.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus jenis usaha kustom ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold w-fit mt-1">
                      Kustom
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="p-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kustom</span>
                </button>
              </div>

              {/* Custom Terminology */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Label Item
                  </label>
                  <input
                    type="text"
                    value={itemLabel}
                    onChange={(e) => setItemLabel(e.target.value)}
                    placeholder="Menu / Produk"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Label Kategori
                  </label>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    placeholder="Kategori"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nomor Identitas
                  </label>
                  <input
                    type="text"
                    value={orderIdentifier}
                    onChange={(e) => setOrderIdentifier(e.target.value)}
                    placeholder="Nomor Meja / Plat"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* 4. Umpan Balik Suara (Audio Chime) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Umpan Balik Suara (Audio Chime)</span>
              </h3>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSoundMuted ? (
                    <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-blue-700 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      Bunyi Sintetis Kasir
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Bunyi saat input menu & transaksi sukses. Tersimpan otomatis di perangkat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = sound.toggleMute();
                    setIsSoundMuted(nextMuted);
                    if (!nextMuted) {
                      sound.playBlip();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    isSoundMuted
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                  }`}
                >
                  {isSoundMuted ? 'Senyap (Mute)' : 'Aktif (Sound On)'}
                </button>
              </div>
            </div>

            {/* 5. Thermal Receipt & Tax Setup */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Struk Cetak & Pajak</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ukuran Kertas Printer
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaperSize('58mm')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${paperSize === '58mm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                    >
                      58mm (Kecil)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperSize('80mm')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${paperSize === '80mm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                    >
                      80mm (Besar)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tampilkan Logo di Struk
                  </label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span>Cetak Logo Brand</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pajak Resto/PB1 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Biaya Layanan/Service (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={serviceChargePct}
                    onChange={(e) => setServiceChargePct(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold tabular-nums"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teks Penutup Struk (Footer)
                  </label>
                  <textarea
                    rows={2}
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Terima kasih atas kunjungan Anda!"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* RIGHT: Live Interactive Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span>Pratinjau Langsung (Live Preview)</span>
              <span className="text-[10px] text-emerald-400 font-mono">Real-Time Sync</span>
            </div>

            {/* Preview 1: Header Simulator */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tampilan Header Aplikasi Toko
              </span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={brandName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="font-bold text-base text-blue-600">{brandName.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{brandName}</h4>
                  <p className="text-[11px] text-slate-600 truncate">{tagline || 'Sistem Kasir UMKM'}</p>
                </div>
              </div>
            </div>

            {/* Preview 2: Thermal Receipt 58mm Paper Simulation */}
            <div className="bg-slate-200/70 p-4 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pratinjau Cetak Struk ({paperSize})
              </span>

              <div
                className={`bg-white shadow-md border border-slate-300 p-3.5 font-receipt text-slate-800 text-xs rounded-sm relative selection:bg-none ${paperSize === '58mm' ? 'w-[250px]' : 'w-[290px]'
                  }`}
              >
                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                  {showLogo && logoUrl && (
                    <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-200 mb-1 flex items-center justify-center">
                      <Image
                        src={logoUrl}
                        alt={brandName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover grayscale"
                        unoptimized
                      />
                    </div>
                  )}
                  <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                    {brandName}
                  </h4>
                  {headerText && <p className="text-[10px] text-slate-600">{headerText}</p>}
                  <p className="text-[9px] text-slate-500">{address}</p>
                  <p className="text-[9px] text-slate-500">WA: {phoneWhatsapp}</p>
                </div>

                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>INV-20261111-9999</span>
                    <span>11/11/26 12:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{orderIdentifier}: Meja 01</span>
                    <span>Kasir: Budi</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Item Contoh x1</span>
                    <span className="tabular-nums font-bold">Rp 25.000</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">Rp 25.000</span>
                  </div>
                  {taxPercentage > 0 && (
                    <div className="flex justify-between">
                      <span>Pajak ({taxPercentage}%)</span>
                      <span className="tabular-nums">{formatRupiah((25000 * taxPercentage) / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span className="tabular-nums">{formatRupiah(25000 + (25000 * taxPercentage) / 100)}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-slate-500 whitespace-pre-line">
                  <p>{footerText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Jenis Usaha Kustom */}
      {isCustomModalOpen && (
        <CustomBusinessTypeModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onSaved={(newType) => {
            setItemLabel(newType.itemLabel);
            setCategoryLabel(newType.categoryLabel);
            setOrderIdentifier(newType.orderIdentifier);
            if (newType.themeColor) setThemeColor(newType.themeColor);
          }}
        />
      )}
    </div>
  );
};

