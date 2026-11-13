# KASA — MODULAR WHITE-LABEL POS & CASHFLOW OS UNTUK UMKM
### Pedoman Pengembangan & Aturan Kunci Project (Locked Skills)

<!-- locked-skills:start -->
## 🔒 Kumpulan Skill Kunci Terpilih (Paket Lengkap POS UMKM)
Project ini dikunci dengan 6 pilar skill utama hasil seleksi interaktif `skill-selector-sakti`:

1. **AMATERASU (`amaterasu`)**
   - Efisiensi penalaran tingkat tinggi, zero padding, arsitektur modular, dan kepatuhan standar produksi enterprise.
2. **THE YOUNGSTER (`the-youngster`)**
   - Pelacakan memori proyek, rekaman keputusan arsitektural, dan kontinuitas log task di `.youngster/`.
3. **ANTI-SLOP SUITE (`antislop`, `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`, `stop-slop`)**
   - Menjamin antarmuka dibuat dengan standar desainer manusia, bukan generic AI slop.
   - Zero-accounting jargon: DILARANG menggunakan istilah rumit seperti "Jurnal Debit/Kredit", "Neraca Saldo", atau "Buku Besar". Wajib gunakan "Uang Masuk", "Uang Keluar", "Keuntungan Bersih", "Kas Laci", dan "Menu Terlaris".
4. **UI/UX PRO MAX & UI STYLING (`ui-ux-pro-max`, `ui-styling`)**
   - "Tactile Clarity": Target sentuhan tombol POS minimal 56×56px agar kasir tidak salah tekan.
   - Kontras tinggi daylight-friendly (WCAG AA 4.5:1 / 7:1) untuk tablet di warung semi-outdoor.
   - Angka nominal Rupiah menggunakan `font-variant-numeric: tabular-nums` agar sejajar sempurna.
5. **BRAND & DYNAMIC WHITE-LABEL (`brand`, `design-system`)**
   - Logo aplikasi default menggunakan format `*.jpg` (`public/logo.jpg`), mendukung logo custom UMKM.
   - Dynamic White-Label via CSS Variables (`--brand-primary`, `--brand-primary-dark`, `--brand-surface`, dsb.) yang dapat diganti secara instan oleh UMKM tanpa reload.
   - Struk termal 58mm & 80mm realistis (JetBrains Mono / monospace) dengan logo, header, dan footer toko.
<!-- locked-skills:end -->

---

## 📐 Arsitektur & Aturan Teknis
1. **Framework:** Next.js 15 (App Router, React 19, TypeScript Strict, Tailwind CSS v4).
2. **Penyimpanan Lokal & Offline-First:** Dexie.js (IndexedDB) + LocalStorage sebagai cache utama. Transaksi POS dan pencatatan kas keluar laci kasir wajib 100% berfungsi saat koneksi internet mati.
3. **Keamanan & RBAC:**
   - Pemisahan peran Admin/Owner (akses penuh backoffice, HPP, dashboard laba bersih) vs Kasir (POS, pengeluaran kas laci, tutup shift).
   - Fast 6-digit PIN Switch untuk pergantian shift kasir dan Supervisor Override (untuk pembatalan void transaksi atau diskon khusus).
   - Audit Log wajib mencatat seluruh aksi sensitif (Void, override harga, selisih kas).
4. **Chameleon Engine & Otoritas Khusus Pemilik Usaha (Owner-Exclusive):**
   - Preset mode: F&B (Nomor Meja, Varian pedas/manis/suhu, Dapur), Retail (Barcode/SKU, Eceran/Grosir, Stok), Jasa (Durasi layanan, Staf, Status pengerjaan), dan Kustom.
   - **Pemusatan Konfigurasi di Branding Toko:** Seluruh setup usaha dipusatkan langsung di menu Branding Toko; Panduan Setup (Onboarding Wizard) ditiadakan.
   - **Menu Jenis Usaha & Kustomisasi (+):** Menu "Muat Contoh Usaha" pada Katalog Menu digantikan menjadi "Jenis Usaha" dan dipusatkan ke menu Branding Toko (serta dapat diakses langsung oleh owner pada Katalog Menu). Dropdown Jenis Usaha wajib menyediakan tombol `+` (Tambah Jenis Usaha) agar pemilik usaha dapat mendefinisikan jenis usaha kustom (Laundry, Bengkel, Petshop, Apotek, Car Wash, dsb.) dengan istilah dan satuan yang disesuaikan secara mandiri.

