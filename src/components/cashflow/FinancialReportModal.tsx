'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { Order, CashflowEntry } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import {
  formatRupiah,
  formatDateShort,
  formatDateTime,
} from '@/core/formatters';

type ReportPeriod = 'today' | 'month' | 'custom' | 'all';

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'custom', label: 'Periode Kustom' },
  { id: 'all', label: 'Semua' },
];

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { branding, activeMember } = useAppStore();

  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashflow, setCashflow] = useState<CashflowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      const [allOrders, allCashflow] = await Promise.all([
        db.orders.where('paymentStatus').notEqual('voided').toArray(),
        db.cashflow.toArray(),
      ]);
      setOrders(allOrders);
      setCashflow(allCashflow);
      setIsLoading(false);
    };
    load();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { filteredOrders, filteredCashflow, periodLabel } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let startTs = -Infinity;
    let endTs = Infinity;
    let label = 'Semua Periode';

    if (period === 'today') {
      startTs = startOfToday;
      label = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (period === 'month') {
      startTs = startOfMonth;
      label = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else if (period === 'custom') {
      if (customStart) {
        startTs = new Date(`${customStart}T00:00:00`).getTime();
      }
      if (customEnd) {
        endTs = new Date(`${customEnd}T23:59:59.999`).getTime();
      }
      label =
        customStart || customEnd
          ? `${customStart || 'Awal'} s/d ${customEnd || 'Sekarang'}`
          : 'Periode Kustom';
    }

    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= startTs && t <= endTs;
    };

    return {
      filteredOrders: orders.filter((o) => inRange(o.createdAt)),
      filteredCashflow: cashflow.filter((c) => inRange(c.transactionDate)),
      periodLabel: label,
    };
  }, [orders, cashflow, period, customStart, customEnd]);

  const metrics = useMemo(() => {
    const omzet = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const hpp = filteredOrders.reduce((sum, o) => sum + o.totalCostAmount, 0);
    const uangMasuk = filteredCashflow
      .filter((c) => c.entryType === 'income')
      .reduce((sum, c) => sum + c.amount, 0);
    const uangKeluar = filteredCashflow
      .filter((c) => c.entryType === 'expense')
      .reduce((sum, c) => sum + c.amount, 0);
    return {
      omzet,
      hpp,
      uangMasuk,
      uangKeluar,
      arusKasBersih: uangMasuk - uangKeluar,
      labaBersih: omzet - hpp - uangKeluar,
    };
  }, [filteredOrders, filteredCashflow]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `LAPORAN KEUANGAN - ${branding.brandName.toUpperCase()}\n`;
    csvContent += `Periode: ${periodLabel}\n`;
    csvContent += `Waktu Unduh: ${new Date().toLocaleString('id-ID')}\n\n`;

    csvContent += `RINGKASAN KEUANGAN\n`;
    csvContent += `Total Omzet Penjualan,${metrics.omzet}\n`;
    csvContent += `Total Harga Modal (HPP),${metrics.hpp}\n`;
    csvContent += `Total Uang Masuk,${metrics.uangMasuk}\n`;
    csvContent += `Total Uang Keluar,${metrics.uangKeluar}\n`;
    csvContent += `Arus Kas Bersih,${metrics.arusKasBersih}\n`;
    csvContent += `Laba Bersih,${metrics.labaBersih}\n\n`;

    csvContent += `RINCIAN PENJUALAN\n`;
    csvContent += `Invoice,Tanggal,Kasir,Pelanggan,Metode,Total (Rp),HPP (Rp)\n`;
    filteredOrders.forEach((o) => {
      csvContent += `"${o.invoiceNumber}","${formatDateTime(o.createdAt)}","${o.cashierName}","${o.customerName || '-'}","${o.paymentMethod.toUpperCase()}",${o.totalAmount},${o.totalCostAmount}\n`;
    });

    csvContent += `\nRINCIAN UANG MASUK\n`;
    csvContent += `Tanggal,Kategori,Keterangan,Sumber Dana,Nominal (Rp)\n`;
    filteredCashflow
      .filter((c) => c.entryType === 'income')
      .forEach((c) => {
        csvContent += `"${formatDateTime(c.transactionDate)}","${c.category}","${c.description}","${c.fundSource}",${c.amount}\n`;
      });

    csvContent += `\nRINCIAN UANG KELUAR\n`;
    csvContent += `Tanggal,Kategori,Keterangan,Sumber Dana,Nominal (Rp)\n`;
    filteredCashflow
      .filter((c) => c.entryType === 'expense')
      .forEach((c) => {
        csvContent += `"${formatDateTime(c.transactionDate)}","${c.category}","${c.description}","${c.fundSource}",${c.amount}\n`;
      });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${branding.brandName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const expenseEntries = filteredCashflow.filter((c) => c.entryType === 'expense');
  const incomeEntries = filteredCashflow.filter((c) => c.entryType === 'income');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Laporan Keuangan</h3>
            <p className="text-xs text-slate-600">
              Pilih periode laporan, lalu cetak dokumen resmi atau unduh format Excel / CSV
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal laporan keuangan"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector (screen only, not printed) */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-white space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Dari
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800"
              />
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Sampai
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Printable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          {isLoading ? (
            <div className="w-full max-w-xl flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold">Memuat data laporan...</p>
            </div>
          ) : (
            <div
              id="report-printable"
              className="bg-white shadow-md border border-slate-200 p-6 sm:p-8 rounded-xl max-w-2xl w-full space-y-6 text-slate-800 text-xs"
            >
              {/* Kop Surat Berlogo Toko UMKM */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  {branding.logoUrl && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                      <Image
                        src={branding.logoUrl}
                        alt={branding.brandName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {branding.brandName}
                    </h1>
                    {branding.address && (
                      <p className="text-[11px] text-slate-500">{branding.address}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                    LAPORAN KEUANGAN
                  </span>
                  <span className="text-xs font-bold text-blue-600">{periodLabel}</span>
                </div>
              </div>

              {/* Financial Highlight Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Uang Masuk</span>
                  <span className="text-sm font-extrabold text-emerald-800 tabular-nums">
                    {formatRupiah(metrics.uangMasuk)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 block uppercase font-bold">Uang Keluar</span>
                  <span className="text-sm font-extrabold text-rose-800 tabular-nums">
                    {formatRupiah(metrics.uangKeluar)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 block uppercase font-bold">Arus Kas Bersih</span>
                  <span className="text-sm font-black text-blue-900 tabular-nums">
                    {formatRupiah(metrics.arusKasBersih)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Total Omzet</span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatRupiah(metrics.omzet)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">HPP Produk</span>
                  <span className="text-sm font-extrabold text-slate-700 tabular-nums">
                    {formatRupiah(metrics.hpp)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 block uppercase font-bold">Laba Bersih</span>
                  <span className="text-sm font-black text-indigo-900 tabular-nums">
                    {formatRupiah(metrics.labaBersih)}
                  </span>
                </div>
              </div>

              {/* Sales Transactions Table */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Daftar Penjualan ({filteredOrders.length} Transaksi)
                </h4>
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-1.5">Invoice</th>
                      <th className="p-1.5">Waktu</th>
                      <th className="p-1.5">Metode</th>
                      <th className="p-1.5 text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-slate-500">
                          Tidak ada transaksi pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="p-1.5 font-bold font-mono">{o.invoiceNumber}</td>
                          <td className="p-1.5 text-slate-600">{formatDateTime(o.createdAt)}</td>
                          <td className="p-1.5 uppercase font-medium">{o.paymentMethod}</td>
                          <td className="p-1.5 text-right font-bold tabular-nums">
                            {formatRupiah(o.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cash In / Cash Out Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-emerald-800 uppercase text-[11px] tracking-wider">
                    Uang Masuk ({incomeEntries.length})
                  </h4>
                  <table className="w-full text-left border border-slate-200">
                    <thead className="bg-emerald-50 text-[10px] font-bold text-emerald-800 uppercase border-b border-emerald-200">
                      <tr>
                        <th className="p-1.5">Tanggal</th>
                        <th className="p-1.5">Kategori</th>
                        <th className="p-1.5 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {incomeEntries.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-slate-500">-</td>
                        </tr>
                      ) : (
                        incomeEntries.map((c) => (
                          <tr key={c.id}>
                            <td className="p-1.5 text-slate-600 whitespace-nowrap">{formatDateShort(c.transactionDate)}</td>
                            <td className="p-1.5 font-semibold text-slate-800">{c.category}</td>
                            <td className="p-1.5 text-right font-bold tabular-nums text-emerald-700">
                              {formatRupiah(c.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-rose-800 uppercase text-[11px] tracking-wider">
                    Uang Keluar ({expenseEntries.length})
                  </h4>
                  <table className="w-full text-left border border-slate-200">
                    <thead className="bg-rose-50 text-[10px] font-bold text-rose-800 uppercase border-b border-rose-200">
                      <tr>
                        <th className="p-1.5">Tanggal</th>
                        <th className="p-1.5">Kategori</th>
                        <th className="p-1.5 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {expenseEntries.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-slate-500">-</td>
                        </tr>
                      ) : (
                        expenseEntries.map((c) => (
                          <tr key={c.id}>
                            <td className="p-1.5 text-slate-600 whitespace-nowrap">{formatDateShort(c.transactionDate)}</td>
                            <td className="p-1.5 font-semibold text-slate-800">{c.category}</td>
                            <td className="p-1.5 text-right font-bold tabular-nums text-rose-700">
                              {formatRupiah(c.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Print stamp: timestamp & printer identity */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  Dicetak pada: {formatDateTime(new Date().toISOString())}
                </span>
                <span className="font-semibold text-slate-600">
                  Dicetak oleh: {activeMember.fullName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
