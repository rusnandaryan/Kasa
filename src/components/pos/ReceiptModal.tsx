'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Printer, MessageCircle, X, Check, Share2 } from 'lucide-react';
import { Order } from '@/core/types';
import { useAppStore } from '@/core/store';
import { formatRupiah, formatDateTime } from '@/core/formatters';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { branding } = useAppStore();
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp text receipt generator
  const handleShareWhatsApp = () => {
    let text = `*STRUK PEMBAYARAN*\n`;
    text += `*${branding.brandName}*\n`;
    if (branding.tagline) text += `${branding.tagline}\n`;
    text += `${branding.address}\n`;
    text += `WA: ${branding.phoneWhatsapp}\n`;
    text += `--------------------------------\n`;
    text += `No. Invoice: ${order.invoiceNumber}\n`;
    text += `Tanggal: ${formatDateTime(order.createdAt)}\n`;
    text += `Kasir: ${order.cashierName}\n`;
    if (order.orderIdentifier) text += `${branding.customTerminology.orderIdentifier}: ${order.orderIdentifier}\n`;
    if (order.customerName) text += `Pelanggan: ${order.customerName}\n`;
    text += `--------------------------------\n`;

    order.items.forEach((item) => {
      text += `${item.productName} x${item.qty}\n`;
      if (item.variantsSelected && item.variantsSelected.length > 0) {
        text += `  (${item.variantsSelected.map((v) => v.optionName).join(', ')})\n`;
      }
      text += `  = ${formatRupiah(item.subtotalItem)}\n`;
    });

    text += `--------------------------------\n`;
    text += `Subtotal: ${formatRupiah(order.subtotal)}\n`;
    if (order.discountAmount > 0) text += `Diskon: -${formatRupiah(order.discountAmount)}\n`;
    if (order.taxAmount > 0) text += `Pajak PB1: ${formatRupiah(order.taxAmount)}\n`;
    if (order.serviceAmount > 0) text += `Biaya Layanan: ${formatRupiah(order.serviceAmount)}\n`;
    text += `*TOTAL BAYAR: ${formatRupiah(order.totalAmount)}*\n`;
    text += `Metode: ${order.paymentMethod.toUpperCase()}\n`;
    text += `Bayar: ${formatRupiah(order.amountReceived)}\n`;
    text += `Kembali: ${formatRupiah(order.changeAmount)}\n`;
    text += `--------------------------------\n`;
    text += `${branding.receiptConfig.footerText || 'Terima kasih atas kunjungan Anda!'}\n`;

    const encoded = encodeURIComponent(text);
    const phone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const is58mm = branding.receiptConfig.paperSize === '58mm';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaksi Berhasil</h3>
              <p className="text-[11px] text-slate-500 font-mono">{order.invoiceNumber}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            ref={receiptPrintRef}
            id="thermal-receipt-printable"
            className={`bg-white shadow-md border border-slate-200 p-4 font-receipt text-slate-800 text-xs rounded-sm relative selection:bg-none ${
              is58mm ? 'w-[280px]' : 'w-[340px]'
            }`}
          >
            {/* Top serrated decoration */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              {branding.receiptConfig.showLogo && branding.logoUrl && (
                <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden border border-slate-200 mb-1 flex items-center justify-center">
                  <Image
                    src={branding.logoUrl}
                    alt={branding.brandName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover grayscale contrast-125"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                {branding.brandName}
              </h2>
              {branding.receiptConfig.headerText && (
                <p className="text-[11px] text-slate-600">{branding.receiptConfig.headerText}</p>
              )}
              {branding.receiptConfig.showStoreAddress && (
                <p className="text-[10px] text-slate-500 leading-tight">{branding.address}</p>
              )}
              {branding.receiptConfig.showWhatsapp && (
                <p className="text-[10px] text-slate-500">WA: {branding.phoneWhatsapp}</p>
              )}
            </div>

            {/* Meta info */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>No:</span>
                <span className="font-bold">{order.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.orderIdentifier && (
                <div className="flex justify-between">
                  <span>{branding.customTerminology.orderIdentifier}:</span>
                  <span className="font-bold">{order.orderIdentifier}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Item Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold truncate max-w-[170px]">{item.productName}</span>
                    <span className="font-bold tabular-nums">{formatRupiah(item.subtotalItem)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.qty} x {formatRupiah(item.unitPrice)}
                    </span>
                    {item.variantsSelected && item.variantsSelected.length > 0 && (
                      <span className="truncate max-w-[120px]">
                        {item.variantsSelected.map((v) => v.optionName).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Calculations */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Diskon:</span>
                  <span className="tabular-nums">-{formatRupiah(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak ({branding.taxPercentage}%):</span>
                  <span className="tabular-nums">{formatRupiah(order.taxAmount)}</span>
                </div>
              )}
              {order.serviceAmount > 0 && (
                <div className="flex justify-between">
                  <span>Layanan ({branding.serviceChargePct}%):</span>
                  <span className="tabular-nums">{formatRupiah(order.serviceAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatRupiah(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment & Change */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="uppercase">Metode:</span>
                <span className="font-bold">{order.paymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Diterima:</span>
                <span className="tabular-nums">{formatRupiah(order.amountReceived)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Kembalian:</span>
                <span className="tabular-nums">{formatRupiah(order.changeAmount)}</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 text-center space-y-1 text-[10px] text-slate-500 whitespace-pre-line">
              <p>{branding.receiptConfig.footerText || 'Terima kasih atas kunjungan Anda!'}</p>
              <p className="text-[8px] text-slate-400 font-mono mt-1">
                KASA POS • Cloud & Offline Engine
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk [F9]</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};

