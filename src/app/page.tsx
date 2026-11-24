'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/core/store';
import { resetDatabase } from '@/core/db';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PinLockScreen } from '@/components/layout/PinLockScreen';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { POSTerminal } from '@/components/pos/POSTerminal';
import { CatalogManager } from '@/components/catalog/CatalogManager';
import { CashflowManager } from '@/components/cashflow/CashflowManager';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { StaffManager } from '@/components/staff/StaffManager';
import { SettingsBranding } from '@/components/settings/SettingsBranding';

export default function Home() {
  const {
    isInitializing,
    isAuthenticated,
    initStore,
    forceReady,
    activeTab,
    isPinLocked,
    setOnlineStatus,
  } = useAppStore();

  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    // 1. Initialize store & database safely
    initStore();

    // 2. Safety watchdog timer: if initialization takes longer than 2s, show escape buttons
    const longTimer = setTimeout(() => {
      setIsTakingLong(true);
    }, 2000);

    // 3. Absolute watchdog timer: if still stuck after 3.5s, force app to open
    const watchdogTimer = setTimeout(() => {
      console.warn('Watchdog: Inisialisasi melebihi batas waktu (3.5s), memaksa aplikasi siap.');
      forceReady();
    }, 3500);

    // 4. Online / Offline network listeners
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(longTimer);
      clearTimeout(watchdogTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initStore, forceReady, setOnlineStatus]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-tight">KASA POS & CASHFLOW OS</h2>
        <p className="text-xs text-slate-300 mt-1">Memuat database lokal & identitas brand...</p>

        {isTakingLong && (
          <div className="mt-6 p-4 max-w-sm w-full bg-slate-800/90 border border-slate-700 rounded-2xl text-center space-y-3 shadow-xl">
            <p className="text-xs text-amber-300 font-medium">
              Inisialisasi memakan waktu lebih lama dari biasanya.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => forceReady()}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
              >
                Buka Aplikasi Sekarang
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetDatabase();
                  window.location.reload();
                }}
                className="w-full h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors"
              >
                Reset Database Lokal &amp; Muat Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 select-none antialiased">
      {/* 6-Digit PIN Screen Lock if locked */}
      {isPinLocked && <PinLockScreen />}

      {/* Top Application Header */}
      <Header />

      {/* Navigation Tab Bar */}
      <Navigation />

      {/* Main Active Surface */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'pos' && <POSTerminal />}
        {activeTab === 'catalog' && <CatalogManager />}
        {activeTab === 'cashflow' && <CashflowManager />}
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'settings' && <SettingsBranding />}
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  );
}
