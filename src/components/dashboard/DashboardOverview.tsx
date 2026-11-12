'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Download,
  Calendar,
  PieChart,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { Order, CashflowEntry } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah } from '@/core/formatters';
import { ExportReportModal } from './ExportReportModal';

export type DashboardPeriod = 'today' | 'yesterday' | '7days' | 'month' | 'all';

export const DashboardOverview: React.FC = () => {
  const { branding } = useAppStore();

  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashflow, setCashflow] = useState<CashflowEntry[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadData = async () => {
    const allOrders = await db.orders.where('paymentStatus').notEqual('voided').toArray();
    const allCashflow = await db.cashflow.toArray();
    setOrders(allOrders);
    setCashflow(allCashflow);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter by period
  const { filteredOrders, filteredCashflow, periodLabel } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const sevenDaysAgo = startOfToday - 86400000 * 6;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let filteredO = orders;
    let filteredC = cashflow;
    let label = 'Hari Ini';

    if (period === 'today') {
      filteredO = orders.filter((o) => new Date(o.createdAt).getTime() >= startOfToday);
      filteredC = cashflow.filter((c) => new Date(c.transactionDate).getTime() >= startOfToday);
      label = 'Hari Ini';
    } else if (period === 'yesterday') {
      filteredO = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= startOfYesterday && t < startOfToday;
      });
      filteredC = cashflow.filter((c) => {
        const t = new Date(c.transactionDate).getTime();
        return t >= startOfYesterday && t < startOfToday;
      });
      label = 'Kemarin';
    } else if (period === '7days') {
      filteredO = orders.filter((o) => new Date(o.createdAt).getTime() >= sevenDaysAgo);
      filteredC = cashflow.filter((c) => new Date(c.transactionDate).getTime() >= sevenDaysAgo);
      label = '7 Hari Terakhir';
    } else if (period === 'month') {
      filteredO = orders.filter((o) => new Date(o.createdAt).getTime() >= startOfMonth);
      filteredC = cashflow.filter((c) => new Date(c.transactionDate).getTime() >= startOfMonth);
      label = 'Bulan Ini';
    } else {
      label = 'Semua Periode';
    }

    return { filteredOrders: filteredO, filteredCashflow: filteredC, periodLabel: label };
  }, [orders, cashflow, period]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredOrders]);

  const totalHpp = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.totalCostAmount, 0);
  }, [filteredOrders]);

  const totalExpenses = useMemo(() => {
    return filteredCashflow
      .filter((c) => c.entryType === 'expense')
      .reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCashflow]);

  // Net Profit = Total Omzet - HPP Produk - Pengeluaran Operasional
  const netProfit = totalRevenue - totalHpp - totalExpenses;

  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  // Best Sellers (Top 5)
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        if (!map[it.productName]) {
          map[it.productName] = { name: it.productName, qty: 0, revenue: 0 };
        }
        map[it.productName].qty += it.qty;
        map[it.productName].revenue += it.subtotalItem;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, qris: 0, transfer: 0, ewallet: 0, debt: 0 };
    filteredOrders.forEach((o) => {
      map[o.paymentMethod] = (map[o.paymentMethod] || 0) + o.totalAmount;
    });
    return map;
  }, [filteredOrders]);

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header & Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Ringkasan Laba & Performa Keuangan
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Lihat omzet, beban belanja, dan keuntungan bersih nyata tanpa istilah akuntansi yang rumit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: '7days', label: '7 Hari' },
                { id: 'month', label: 'Bulan Ini' },
                { id: 'all', label: 'Semua' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id as DashboardPeriod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Export Report Trigger */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
          </div>
        </div>

        {/* 4 BIG METRIC CARDS (ZERO JARGON) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Pemasukan / Omzet */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Uang Masuk (Omzet)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {formatRupiah(totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari {orderCount} transaksi {periodLabel.toLowerCase()}
            </p>
          </div>

          {/* Card 2: Total Pengeluaran */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Uang Keluar (Belanja)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-700 tabular-nums">
              {formatRupiah(totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Beban operasional, bahan baku & gaji
            </p>
          </div>

          {/* Card 3: Keuntungan Bersih */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Keuntungan Bersih (Net Profit)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-2xl font-black tabular-nums ${
                netProfit >= 0 ? 'text-blue-900' : 'text-rose-700'
              }`}
            >
              {formatRupiah(netProfit)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Omzet - HPP ({formatRupiah(totalHpp)}) - Pengeluaran
            </p>
          </div>

          {/* Card 4: Transaksi & Rata-rata Belanja */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Rata-rata Belanja
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {formatRupiah(avgOrderValue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total {orderCount} nota belanja pelanggan
            </p>
          </div>
        </div>

        {/* Visual Bar Comparison Chart (Clean & Simple) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Perbandingan Uang Masuk vs Uang Keluar</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                {periodLabel}
              </span>
            </h3>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-emerald-500" />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-rose-500" />
                <span>Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Visual Ratio Bar */}
          {totalRevenue + totalExpenses === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada pergerakan kas pada periode ini.
            </div>
          ) : (
            (() => {
              const totalMovement = totalRevenue + totalExpenses;
              const incomePct = Math.round((totalRevenue / totalMovement) * 100);
              const expensePct = 100 - incomePct;
              return (
                <div className="space-y-3">
                  <div className="h-7 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                    {incomePct > 0 && (
                      <div
                        style={{ width: `${incomePct}%` }}
                        className="bg-emerald-600 transition-all duration-500 h-full flex items-center justify-center text-[10px] font-bold text-white tabular-nums overflow-hidden"
                      >
                        {incomePct >= 8 ? `${incomePct}%` : ''}
                      </div>
                    )}
                    {expensePct > 0 && (
                      <div
                        style={{ width: `${expensePct}%` }}
                        className="bg-rose-600 transition-all duration-500 h-full flex items-center justify-center text-[10px] font-bold text-white tabular-nums overflow-hidden"
                      >
                        {expensePct >= 8 ? `${expensePct}%` : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs font-bold tabular-nums">
                    <span className="text-emerald-700">Uang Masuk ({incomePct}%): {formatRupiah(totalRevenue)}</span>
                    <span className="text-rose-700">Uang Keluar ({expensePct}%): {formatRupiah(totalExpenses)}</span>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* 2 Side-by-Side Lists: Top 5 Bestsellers & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Bestsellers */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top 5 {branding.customTerminology.itemLabel} Terlaris</span>
              </h3>
              <span className="text-[11px] text-slate-500">Berdasarkan Jumlah Terjual</span>
            </div>

            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada transaksi penjualan pada periode ini.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {p.qty} terjual
                      </span>
                      <span className="text-[11px] text-slate-500 ml-2 tabular-nums">
                        ({formatRupiah(p.revenue)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-500" />
                <span>Rincian Metode Pembayaran</span>
              </h3>
              <span className="text-[11px] text-slate-500">{periodLabel}</span>
            </div>

            {totalRevenue === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada transaksi pada periode ini.
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'cash', label: 'Tunai (Cash)', color: 'bg-emerald-500' },
                  { key: 'qris', label: 'QRIS', color: 'bg-blue-500' },
                  { key: 'transfer', label: 'Transfer Bank', color: 'bg-purple-500' },
                  { key: 'ewallet', label: 'E-Wallet', color: 'bg-indigo-500' },
                  { key: 'debt', label: 'Kasbon / Piutang', color: 'bg-amber-500' },
                ].map((m) => {
                  const val = paymentBreakdown[m.key] || 0;
                  const pct = totalRevenue > 0 ? Math.round((val / totalRevenue) * 100) : 0;

                  return (
                    <div key={m.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{m.label}</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatRupiah(val)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${m.color} rounded-full transition-all duration-300`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        periodLabel={periodLabel}
        orders={filteredOrders}
        cashflow={filteredCashflow}
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
        totalHpp={totalHpp}
        netProfit={netProfit}
      />
    </div>
  );
};

