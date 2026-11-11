'use client';

import React, { useEffect, useState } from 'react';
import { X, Keyboard, Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/core/sound';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'F2',
      name: 'Cari Menu / Barcode',
      desc: 'Langsung memindahkan kursor ke kolom pencarian produk atau barcode scanner.',
    },
    {
      key: 'F8',
      name: 'Bayar Cepat (Checkout)',
      desc: 'Membuka modal proses pembayaran untuk pesanan aktif di keranjang.',
    },
    {
      key: 'F9',
      name: 'Cetak Struk Thermal',
      desc: 'Memicu cetak struk kasir saat jendela transaksi selesai terbuka.',
    },
    {
      key: 'Esc',
      name: 'Tutup Dialog / Batal',
      desc: 'Menutup pop-up pembayaran, struk, atau modal lain yang sedang aktif.',
    },
    {
      key: '?',
      name: 'Buka Panduan Pintas',
      desc: 'Menampilkan cheatsheet shortcut keyboard ini kapan saja.',
    },
  ];

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playBlip();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="shortcut-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                Panduan Tombol Pintas Kasir
              </h3>
              <p className="text-xs text-slate-500">
                Percepat transaksi kasir tanpa ketergantungan mouse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan shortcut"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="p-3.5 flex items-start gap-3 bg-white hover:bg-slate-50/80 transition-colors">
                <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs font-bold text-slate-900 shadow-2xs shrink-0">
                  {sc.key}
                </kbd>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {sc.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sound Feedback Setting */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-blue-700" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Umpan Balik Suara (Audio Chime)
                </p>
                <p className="text-[11px] text-slate-600">
                  Bunyi sintetis saat input menu & transaksi sukses
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isMuted
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
              }`}
            >
              {isMuted ? 'Senyap (Mute)' : 'Aktif (Sound On)'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Tekan <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-700">Esc</kbd> untuk kembali</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
