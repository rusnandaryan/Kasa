'use client';

import React from 'react';
import Image from 'next/image';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 px-3 sm:px-4 py-2.5 shrink-0">
      <div className="w-full flex items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-5 h-5 rounded-md overflow-hidden border border-slate-200 bg-white shrink-0">
            <Image
              src="/logo.jpg"
              alt="Logo KASA"
              width={20}
              height={20}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <span className="font-bold text-slate-800 tracking-tight shrink-0">KASA</span>
          <span className="text-slate-300" aria-hidden="true">•</span>
          <span className="truncate">Sistem Kasir &amp; Pembukuan UMKM by KASA</span>
        </div>
      </div>
    </footer>
  );
};

