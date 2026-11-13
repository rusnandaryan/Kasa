'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Wifi,
  WifiOff,
  Lock,
  UserCheck,
  Keyboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/core/store';
import { ROLE_LABELS } from '@/core/auth';
import { formatRupiah } from '@/core/formatters';

interface HeaderProps {
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenShortcuts,
}) => {
  const {
    branding,
    activeMember,
    lockApp,
    logout,
    isOnline,
    activeShift,
  } = useAppStore();

  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMemberDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (memberMenuRef.current && !memberMenuRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showMemberDropdown]);

  const isOwner = activeMember.role === 'owner';
  const headerLogoUrl = isOwner ? '/logo.jpg' : branding.logoUrl;
  const headerTitle = isOwner ? 'KASA' : branding.brandName;
  const headerSubtitle = isOwner
    ? 'Sistem Kasir & Pembukuan UMKM'
    : branding.address || 'Alamat toko belum diatur';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs flex items-center justify-center">
              {headerLogoUrl ? (
                <Image
                  key={headerLogoUrl}
                  src={headerLogoUrl}
                  alt={`Logo ${headerTitle}`}
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
                  {headerTitle.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate leading-tight">
                {headerTitle}
              </h1>
              <p className="text-xs text-slate-600 truncate hidden sm:block">
                {headerSubtitle}
              </p>
            </div>
          </div>

          {/* Center Actions: Shortcuts */}
          <div className="flex items-center gap-2">
            {/* Shortcut Cheatsheet Button (Finding UX-03 / REC-02) */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Buka panduan tombol pintas keyboard [?]"
              >
                <Keyboard className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Tombol Pintas</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-200/80 font-mono text-[10px] text-slate-700 font-bold">?</kbd>
              </button>
            )}
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

            {/* Active Member Account Menu */}
            <div ref={memberMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                aria-label="Menu akun pengguna aktif"
                aria-expanded={showMemberDropdown}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-left transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-bold text-slate-900 leading-tight max-w-[140px] sm:max-w-[180px] truncate">
                    {activeMember.fullName}
                  </span>
                  <span
                    className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider leading-tight ${
                      activeMember.role === 'owner'
                        ? 'bg-slate-900 text-white'
                        : activeMember.role === 'admin'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {ROLE_LABELS[activeMember.role]}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {showMemberDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {activeMember.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {activeMember.username} • {ROLE_LABELS[activeMember.role]}
                    </p>
                    {activeShift && (
                      <p className="text-xs text-slate-600 pt-1">
                        Modal Laci: <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(activeShift.openingCash)}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-1 px-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMemberDropdown(false);
                        lockApp();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Kunci Layar (PIN Lock)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMemberDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Keluar / Log Out</span>
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
