'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Coins,
  FileText,
  Calendar,
  Filter,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { CashflowEntry } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import { formatRupiah, formatDateTime } from '@/core/formatters';
import { CashflowEntryModal } from './CashflowEntryModal';
import { ShiftCloseModal } from './ShiftCloseModal';

export const CashflowManager: React.FC = () => {
  const { branding, activeMember, activeShift } = useAppStore();

  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'cash_drawer' | 'bank_owner'>('all');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<'income' | 'expense'>('expense');
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const loadData = async () => {
    const list = await db.cashflow.orderBy('transactionDate').reverse().toArray();
    setEntries(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteEntry = async (entry: CashflowEntry) => {
    if (activeMember.role === 'cashier') {
      alert('Kasir tidak diizinkan menghapus catatan kas.');
      return;
    }
    if (confirm(`Hapus catatan ${entry.category} sebesar ${formatRupiah(entry.amount)}?`)) {
      await db.cashflow.delete(entry.id);
      loadData();
    }
  };

  // Filtered entries
  const filteredEntries = entries.filter((e) => {
    const matchType = filterType === 'all' || e.entryType === filterType;
    const matchSource = filterSource === 'all' || e.fundSource === filterSource;
    return matchType && matchSource;
  });

  // Totals
  const totalIncome = entries
    .filter((e) => e.entryType === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = entries
    .filter((e) => e.entryType === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Cash Flow
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pemantauan seluruh pemasukan penjualan dan catatan kas keluar usaha.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tutup Shift Button */}
            {activeShift && (
              <button
                type="button"
                onClick={() => setIsShiftCloseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Tutup Shift Kasir</span>
              </button>
            )}

            {/* Kas Keluar Button */}
            <button
              type="button"
              onClick={() => {
                setEntryModalType('expense');
                setIsEntryModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pemasukan/Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Big Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Income Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Uang Masuk
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
              {formatRupiah(totalIncome)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Penjualan kasir & modal masuk,dll</p>
          </div>

          {/* Expense Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total Uang Keluar
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-700 tabular-nums">
              {formatRupiah(totalExpense)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Belanja bahan, operasional & gaji, dll </p>
          </div>

          {/* Net Cashflow Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Arus Kas Bersih
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-xl sm:text-2xl font-extrabold tabular-nums ${netCashflow >= 0 ? 'text-blue-700' : 'text-rose-700'
                }`}
            >
              {formatRupiah(netCashflow)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {netCashflow >= 0 ? 'Pendapatan Surplus' : 'Pendapatan Defisit'}
            </p>
          </div>
        </div>

        {/* Filter Controls & Cashflow Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 mr-1">Tipe:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'income', label: 'Masuk (+)' },
                { id: 'expense', label: 'Keluar (-)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id as 'all' | 'income' | 'expense')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterType === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 mr-1">Sumber:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'cash_drawer', label: 'Kas Laci' },
                { id: 'bank_owner', label: 'Bank / Owner' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilterSource(s.id as 'all' | 'cash_drawer' | 'bank_owner')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filterSource === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Kategori & Keterangan</th>
                  <th className="py-3 px-4">Sumber Dana</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Nota</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 px-4">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Belum Ada Catatan Kas</p>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                          Belum ada transaksi pemasukan atau kas keluar yang dicatat pada filter ini.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEntryModalType('expense');
                              setIsEntryModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Kas Keluar</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e) => {
                    const isIncome = e.entryType === 'income';

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                          {formatDateTime(e.transactionDate)}
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isIncome
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                                  }`}
                              >
                                {e.category}
                              </span>
                            </div>
                            <p className="text-slate-800 font-semibold mt-0.5">{e.description}</p>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {e.fundSource === 'cash_drawer' ? '💵 Laci Kasir' : '💳 Bank / Owner'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {e.creatorName}
                        </td>

                        <td className="py-3 px-4 text-right font-black tabular-nums whitespace-nowrap">
                          <span
                            className={isIncome ? 'text-emerald-700' : 'text-rose-700'}
                          >
                            {isIncome ? `+${formatRupiah(e.amount)}` : `-${formatRupiah(e.amount)}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {e.receiptPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(e.receiptPhotoUrl || null)}
                              aria-label="Lihat foto bukti nota"
                              className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                              title="Lihat Foto Bukti Nota"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(e)}
                            aria-label={`Hapus catatan kas ${e.category}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <CashflowEntryModal
          isOpen={isEntryModalOpen}
          initialType={entryModalType}
          onClose={() => setIsEntryModalOpen(false)}
          onSaved={loadData}
        />
      )}

      {/* Shift Close Modal */}
      <ShiftCloseModal
        isOpen={isShiftCloseModalOpen}
        onClose={() => setIsShiftCloseModalOpen(false)}
        onShiftClosed={loadData}
      />

      {/* Receipt Photo Lightbox Preview */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoUrl}
              alt="Bukti Nota Kas"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-600 py-2">
              Klik di mana saja untuk menutup pratinjau nota
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

