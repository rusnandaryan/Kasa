'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/core/store';
import { initializeDatabase } from '@/core/db';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { PinLockScreen } from '@/components/layout/PinLockScreen';
import { POSTerminal } from '@/components/pos/POSTerminal';
import { CatalogManager } from '@/components/catalog/CatalogManager';
import { CashflowManager } from '@/components/cashflow/CashflowManager';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { StaffManager } from '@/components/staff/StaffManager';
import { SettingsBranding } from '@/components/settings/SettingsBranding';
import { CashflowEntryModal } from '@/components/cashflow/CashflowEntryModal';
import { HoldOrdersModal } from '@/components/pos/HoldOrdersModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export default function Home() {
  const {
    isInitializing,
    initStore,
    activeTab,
    isPinLocked,
    setOnlineStatus,
  } = useAppStore();

  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    // 1. Initialize IndexedDB & Seed data if empty
    initializeDatabase().then(() => {
      initStore();
    });

    // 2. Online / Offline network listeners
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initStore, setOnlineStatus]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-tight">KASA POS & CASHFLOW OS</h2>
        <p className="text-xs text-slate-400 mt-1">Memuat database lokal & identitas brand...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 select-none antialiased">
      {/* 6-Digit PIN Screen Lock if locked */}
      {isPinLocked && <PinLockScreen />}

      {/* Top Application Header */}
      <Header
        onOpenQuickExpense={() => setIsQuickExpenseOpen(true)}
        onOpenHoldModal={() => setIsHoldModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Navigation Tab Bar */}
      <Navigation />

      {/* Main Active Surface */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && <POSTerminal />}
        {activeTab === 'catalog' && <CatalogManager />}
        {activeTab === 'cashflow' && <CashflowManager />}
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'settings' && <SettingsBranding />}
      </main>

      {/* Quick Cashflow Out Modal */}
      <CashflowEntryModal
        isOpen={isQuickExpenseOpen}
        initialType="expense"
        onClose={() => setIsQuickExpenseOpen(false)}
        onSaved={() => {
          // Handled within store and components
        }}
      />

      {/* Parked Orders Modal */}
      <HoldOrdersModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
