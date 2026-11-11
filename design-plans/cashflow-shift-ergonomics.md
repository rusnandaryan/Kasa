# Cashflow & Shift Close Ergonomics Improvement Plan

Written against: 9250b3a

## Design language
- Audited surface: `Kasa/src/components/cashflow/*` (CashflowManager, CashflowEntryModal, ShiftCloseModal)
- Design sources: `design-system/kasa-pos/MASTER.md` (Density 8/10, Financial Semantic Tokens, Currency Contract)
- Documented decisions: Density 8/10, `--income: #10B981`, `--expense: #F43F5E`, `--brand-primary: #2563EB`, Tabular-nums for currencies
- Governing owners and consumers: `CashflowManager.tsx`, `ShiftCloseModal.tsx`, `CashflowEntryModal.tsx`
- Explicit exceptions: None documented

## Findings

| # | Problem | Evidence | Proposed change | Scope | Confidence |
|---|---|---|---|---|---|
| 1 | Input penghitungan uang fisik laci kasir saat tutup shift tidak memiliki pembacaan format rupiah langsung, menyulitkan kasir saat menghitung pecahan besar. | `ShiftCloseModal.tsx:190` (`<input type="number" value={actualCash} />`) | Tambahkan live formatted confirmation helper tepat di bawah input: `{actualCash > 0 && <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">Terbaca: {formatRupiah(actualCash)}</p>}`. | Modal Tutup Shift Kasir | High |
| 2 | Input nominal pengeluaran/pemasukan kas harian tidak memiliki live subtitle konfirmasi rupiah, berisiko kelebihan atau kekurangan digit nol pada transaksi belanja bahan baku. | `CashflowEntryModal.tsx:174` (`<input type="number" value={amount} />`) | Tambahkan live currency reader subtitle: `{amount > 0 && <p className="text-xs font-bold text-blue-700 mt-1.5 tabular-nums">Terbaca: {formatRupiah(amount)}</p>}`. | Modal Catat Kas Masuk/Keluar | High |
| 3 | Modal operasional kas dan rekonsiliasi shift belum mendukung pembatalan cepat via tombol `Escape`, memecah konsistensi navigasi keyboard sistem kasir. | `ShiftCloseModal.tsx`, `CashflowEntryModal.tsx` | Tambahkan event listener `Escape` pada hook `useEffect` untuk memicu aksi `onClose()`. | Seluruh Modal Modul Buku Kas | High |

## Improve first
> [!IMPORTANT]
> **Temuan #1 (Input Uang Fisik Laci Kasir)** adalah perubahan dengan dampak tertinggi. Rekonsiliasi tutup shift (*blind cash drop*) adalah momen paling rawan sengketa antara kasir dan pemilik usaha. Bantuan konfirmasi pembacaan nominal langsung saat mengetik nominal uang fisik (misal: membedakan Rp 150.000 vs Rp 1.500.000) mencegah kesalahan input manusiawi dan menjaga akurasi pembukuan kas UMKM.
