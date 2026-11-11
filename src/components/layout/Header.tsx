'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Wifi,
  WifiOff,
  Lock,
  UserCheck,
  PlusCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';

interface HeaderProps {
  onOpenQuickExpense: () => void;
  onOpenHoldModal: () => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickExpense,
  onOpenHoldModal,
  onOpenOnboarding,
}) => {
  const {
    branding,
    activeMember,
    allMembers,
    switchMember,
    lockApp,
    isOnline,
    heldOrders,
    activeShift,
  } = useAppStore();

  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs flex items-center justify-center">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={`Logo ${branding.brandName}`}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-bold text-lg text-blue-600">
                  {branding.brandName.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate leading-tight">
                  {branding.brandName}
                </h1>
                <span
                  className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize"
                  style={{
                    backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                    color: 'var(--brand-primary, #2563EB)',
                  }}
                >
                  {branding.businessType === 'fnb'
                    ? '☕ Kuliner / F&B'
                    : branding.businessType === 'retail'
                    ? '🛒 Retail / Toko'
                    : branding.businessType === 'service'
                    ? '✂️ Jasa / Layanan'
                    : 'Kustom'}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate hidden sm:block">
                {branding.tagline || 'Sistem Kasir & Pembukuan UMKM'}
              </p>
            </div>
          </div>

          {/* Center Actions: Hold Orders & Shift status */}
          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={onOpenHoldModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pesanan Diparkir ({heldOrders.length})</span>
              </button>
            )}

            {/* Quick Expense Shortcut */}
            <button
              type="button"
              onClick={onOpenQuickExpense}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
              title="Catat pengeluaran kas laci cepat"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kas Keluar</span>
            </button>

            {/* Setup Wizard Button (No AI sparkle slop) */}
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Buka panduan setup awal"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Panduan Setup</span>
            </button>
          </div>

          {/* Right Controls: Connectivity, Member & PIN Lock */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline status */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-300'
              }`}
              title={
                isOnline
                  ? 'Sistem Terhubung'
                  : 'Mode Offline: Transaksi tersimpan aman di perangkat'
              }
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden xl:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[11px]">Offline</span>
                </>
              )}
            </div>

            {/* Member Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                aria-label="Pilih akun kasir atau staf"
                aria-expanded={showMemberDropdown}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-xs font-medium text-slate-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-900 max-w-[100px] sm:max-w-[130px] truncate">
                  {activeMember.fullName.split(' ')[0]}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    activeMember.role === 'owner' || activeMember.role === 'admin'
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {activeMember.role}
                </span>
              </button>

              {showMemberDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Ganti Akun Kasir / Staf
                    </p>
                    {activeShift && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        Modal Laci: <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(activeShift.openingCash)}</span>
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    {allMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          switchMember(member.id);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                          member.id === activeMember.id ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate font-semibold">{member.fullName}</p>
                          <p className="text-[10px] text-slate-500 capitalize">PIN: terproteksi</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {member.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMemberDropdown(false);
                        lockApp();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Kunci Layar (PIN Lock)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct PIN Lock Button */}
            <button
              type="button"
              onClick={lockApp}
              aria-label="Kunci Layar Kasir"
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kunci Layar Kasir"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
