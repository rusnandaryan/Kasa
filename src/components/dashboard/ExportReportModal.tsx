'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { X, Printer, Download, FileSpreadsheet } from 'lucide-react';
import { Order, CashflowEntry } from '@/core/types';
import { useAppStore } from '@/core/store';
import { formatRupiah, formatDateShort, formatDateTime } from '@/core/formatters';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  orders: Order[];
  cashflow: CashflowEntry[];
  totalRevenue: number;
  totalExpenses: number;
  totalHpp: number;
  netProfit: number;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  periodLabel,
  orders,
  cashflow,
  totalRevenue,
  totalExpenses,
  totalHpp,
  netProfit,
}) => {
  const { branding } = useAppStore();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `LAPORAN KEUANGAN & TRANSAKSI - ${branding.brandName.toUpperCase()}\n`;
    csvContent += `Periode: ${periodLabel}\n`;
    csvContent += `Waktu Unduh: ${new Date().toLocaleString('id-ID')}\n\n`;

    csvContent += `RINGKASAN UTAMA\n`;
    csvContent += `Total Penjualan/Pemasukan,${totalRevenue}\n`;
    csvContent += `Total Harga Modal (HPP),${totalHpp}\n`;
    csvContent += `Total Beban Pengeluaran,${totalExpenses}\n`;
    csvContent += `Keuntungan Bersih,${netProfit}\n\n`;

    csvContent += `RINCIAN TRANSAKSI PENJUALAN\n`;
    csvContent += `Invoice,Tanggal,Kasir,Pelanggan,Metode,Total (Rp),HPP (Rp)\n`;
    orders.forEach((o) => {
      csvContent += `"${o.invoiceNumber}","${formatDateTime(o.createdAt)}","${o.cashierName}","${o.customerName || '-'}","${o.paymentMethod.toUpperCase()}",${o.totalAmount},${o.totalCostAmount}\n`;
    });

    csvContent += `\nRINCIAN PENGELUARAN KAS\n`;
    csvContent += `Tanggal,Kategori,Keterangan,Sumber Dana,Nominal (Rp)\n`;
    cashflow
      .filter((c) => c.entryType === 'expense')
      .forEach((c) => {
        csvContent += `"${formatDateTime(c.transactionDate)}","${c.category}","${c.description}","${c.fundSource}",${c.amount}\n`;
      });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_${branding.brandName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ekspor Laporan Keuangan</h3>
            <p className="text-xs text-slate-500">
              Cetak PDF resmi berlogo brand toko atau unduh format Excel / CSV
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            ref={printAreaRef}
            className="bg-white shadow-md border border-slate-200 p-6 sm:p-8 rounded-xl max-w-xl w-full space-y-6 text-slate-800 text-xs"
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
                  <p className="text-xs text-slate-600">{branding.tagline}</p>
                  <p className="text-[11px] text-slate-500">{branding.address} • WA: {branding.phoneWhatsapp}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  LAPORAN KAS & LABA
                </span>
                <span className="text-xs font-bold text-blue-600">{periodLabel}</span>
              </div>
            </div>

            {/* 4 Financial Highlight Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Omzet</span>
                <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">HPP Produk</span>
                <span className="text-sm font-extrabold text-slate-700 tabular-nums">
                  {formatRupiah(totalHpp)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Pengeluaran Kas</span>
                <span className="text-sm font-extrabold text-rose-700 tabular-nums">
                  {formatRupiah(totalExpenses)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 block uppercase font-bold">Laba Bersih</span>
                <span className="text-sm font-black text-blue-900 tabular-nums">
                  {formatRupiah(netProfit)}
                </span>
              </div>
            </div>

            {/* Sales Table Snippet */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Daftar Transaksi ({orders.length} Transaksi)
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
                  {orders.slice(0, 10).map((o) => (
                    <tr key={o.id}>
                      <td className="p-1.5 font-bold font-mono">{o.invoiceNumber}</td>
                      <td className="p-1.5 text-slate-500">{formatDateShort(o.createdAt)}</td>
                      <td className="p-1.5 uppercase font-medium">{o.paymentMethod}</td>
                      <td className="p-1.5 text-right font-bold tabular-nums">
                        {formatRupiah(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length > 10 && (
                <p className="text-[10px] text-slate-400 italic">
                  Menampilkan 10 dari {orders.length} transaksi (unduh CSV untuk riwayat penuh).
                </p>
              )}
            </div>

            {/* Sign-off */}
            <div className="pt-6 border-t border-slate-200 flex justify-between text-center text-[10px] text-slate-500">
              <div>
                <p>Dicetak pada: {formatDateTime(new Date().toISOString())}</p>
                <p className="mt-8 font-bold text-slate-700">( Kasir / Staf Toko )</p>
              </div>
              <div>
                <p>Mengetahui,</p>
                <p className="mt-8 font-bold text-slate-700">( Pemilik / Owner Usaha )</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
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

