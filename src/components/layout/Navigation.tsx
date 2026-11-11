'use client';

import React from 'react';
import {
  ShoppingBag,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  Users,
  Palette,
} from 'lucide-react';
import { useAppStore, ActiveTab } from '@/core/store';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, branding, activeMember } = useAppStore();

  const isCashier = activeMember.role === 'cashier';

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingBag },
    {
      id: 'catalog',
      label: branding.customTerminology.itemLabel
        ? `Katalog ${branding.customTerminology.itemLabel}`
        : 'Katalog',
      icon: Layers,
    },
    { id: 'cashflow', label: 'Arus Kas', icon: ArrowLeftRight },
    { id: 'dashboard', label: 'Ringkasan Laba', icon: TrendingUp, adminOnly: true },
    { id: 'staff', label: 'Staf & Akses', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Branding Toko', icon: Palette, adminOnly: true },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = item.adminOnly && isCashier;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isRestricted) {
                    alert('Hanya Owner/Admin yang memiliki akses ke modul ini.');
                    return;
                  }
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'shadow-xs text-white'
                    : isRestricted
                    ? 'opacity-40 text-slate-400 cursor-not-allowed hover:bg-slate-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--brand-primary, #2563EB)',
                        color: 'var(--brand-primary-text, #FFFFFF)',
                      }
                    : undefined
                }
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-inherit' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-700">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

