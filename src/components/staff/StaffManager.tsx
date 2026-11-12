'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  History,
  X,
  Edit2,
  ShieldAlert,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { StoreMember, AuditLog, UserRole } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
import {
  ROLE_LABELS,
  canManageMember,
  canViewMember,
  createUniqueId,
  getCreatableRoles,
  hashPassword,
} from '@/core/auth';
import { formatDateTime } from '@/core/formatters';

export const StaffManager: React.FC = () => {
  const { branding, activeMember, reloadMembers } = useAppStore();

  const [members, setMembers] = useState<StoreMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal Add/Edit Member
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StoreMember | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('');
  const [formError, setFormError] = useState('');
  const [canDiscount, setCanDiscount] = useState(false);
  const [canOpenPrice, setCanOpenPrice] = useState(false);
  const [canViewDailyRevenue, setCanViewDailyRevenue] = useState(true);
  const [canVoidOrder, setCanVoidOrder] = useState(false);

  const creatableRoles = getCreatableRoles(activeMember.role);

  const loadData = async () => {
    const mems = await db.members.toArray();
    const logs = await db.auditLogs.orderBy('createdAt').reverse().limit(30).toArray();
    setMembers(mems);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleMembers = members.filter((m) => canViewMember(activeMember.role, m.role));

  const handleOpenAdd = () => {
    if (creatableRoles.length === 0) return;
    setEditingMember(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setRole(creatableRoles.includes('cashier') ? 'cashier' : creatableRoles[0]);
    setPinCode('');
    setFormError('');
    setCanDiscount(false);
    setCanOpenPrice(false);
    setCanViewDailyRevenue(true);
    setCanVoidOrder(false);
    setIsMemberModalOpen(true);
  };

  const handleOpenEdit = (m: StoreMember) => {
    if (!canManageMember(activeMember, m)) {
      alert('Anda tidak memiliki otorisasi untuk mengubah akun pada tingkatan ini.');
      return;
    }
    setEditingMember(m);
    setFullName(m.fullName);
    setUsername(m.username || '');
    setPassword('');
    setShowPassword(false);
    setRole(m.role);
    setPinCode(m.pinCode);
    setFormError('');
    setCanDiscount(m.permissions.canDiscount);
    setCanOpenPrice(m.permissions.canOpenPrice);
    setCanViewDailyRevenue(m.permissions.canViewDailyRevenue);
    setCanVoidOrder(m.permissions.canVoidOrder);
    setIsMemberModalOpen(true);
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!trimmedName) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(normalizedUsername)) {
      setFormError('ID login minimal 3 karakter (hanya huruf, angka, titik, garis bawah, atau strip).');
      return;
    }

    const duplicate = members.find(
      (m) => (m.username || '').toLowerCase() === normalizedUsername && m.id !== editingMember?.id
    );
    if (duplicate) {
      setFormError(`ID login "${normalizedUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    if (!editingMember && password.length < 4) {
      setFormError('Password wajib diisi minimal 4 karakter untuk akun baru.');
      return;
    }
    if (editingMember && password && password.length < 4) {
      setFormError('Password baru minimal 4 karakter.');
      return;
    }

    if (pinCode.length !== 6 || isNaN(Number(pinCode))) {
      setFormError('PIN wajib terdiri dari 6 angka.');
      return;
    }

    // Strict hierarchical authorization check
    if (editingMember) {
      if (!canManageMember(activeMember, editingMember)) {
        setFormError('Anda tidak memiliki izin untuk mengedit akun ini.');
        return;
      }
      if (editingMember.role !== role && !creatableRoles.includes(role)) {
        setFormError('Anda tidak memiliki izin untuk menetapkan peran tersebut.');
        return;
      }
    } else if (!creatableRoles.includes(role)) {
      setFormError('Anda tidak memiliki izin untuk membuat akun dengan peran tersebut.');
      return;
    }

    const isPrivileged = role === 'owner' || role === 'admin';
    const perms = {
      canDiscount: isPrivileged ? true : canDiscount,
      canOpenPrice: isPrivileged ? true : canOpenPrice,
      canViewDailyRevenue: isPrivileged ? true : canViewDailyRevenue,
      canVoidOrder: isPrivileged ? true : canVoidOrder,
      canManageCatalog: true,
      canManageExpenses: true,
    };

    const now = new Date().toISOString();

    if (editingMember) {
      const updates: Partial<StoreMember> = {
        fullName: trimmedName,
        username: normalizedUsername,
        role,
        pinCode,
        permissions: perms,
      };
      if (password) {
        updates.passwordHash = hashPassword(password);
      }

      await db.members.update(editingMember.id, updates);
      await db.auditLogs.add({
        id: createUniqueId('audit'),
        storeId: branding.id,
        actorMemberId: activeMember.id,
        actorName: activeMember.fullName,
        action: 'STAFF_UPDATED',
        description: `Memperbarui akun ${ROLE_LABELS[role]}: ${trimmedName} (${normalizedUsername})`,
        createdAt: now,
      });
    } else {
      await db.members.add({
        id: createUniqueId('member'),
        storeId: branding.id,
        fullName: trimmedName,
        username: normalizedUsername,
        passwordHash: hashPassword(password),
        role,
        pinCode,
        isActive: true,
        permissions: perms,
      });
      await db.auditLogs.add({
        id: createUniqueId('audit'),
        storeId: branding.id,
        actorMemberId: activeMember.id,
        actorName: activeMember.fullName,
        action: 'STAFF_CREATED',
        description: `Membuat akun ${ROLE_LABELS[role]} baru: ${trimmedName} (${normalizedUsername})`,
        createdAt: now,
      });
    }

    await reloadMembers();
    setIsMemberModalOpen(false);
    loadData();
  };

  const handleToggleMemberActive = async (m: StoreMember) => {
    if (m.id === activeMember.id) {
      alert('Tidak dapat menonaktifkan akun yang sedang aktif Anda gunakan.');
      return;
    }
    if (!canManageMember(activeMember, m)) {
      alert('Anda tidak memiliki otorisasi untuk mengubah status akun ini.');
      return;
    }
    const nextActive = !m.isActive;
    await db.members.update(m.id, {
      isActive: nextActive,
    });
    await db.auditLogs.add({
      id: createUniqueId('audit'),
      storeId: branding.id,
      actorMemberId: activeMember.id,
      actorName: activeMember.fullName,
      action: 'STAFF_STATUS_CHANGED',
      description: `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} akun ${m.fullName} (${m.username})`,
      createdAt: new Date().toISOString(),
    });
    await reloadMembers();
    loadData();
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Kelola Staf, Akun Login &amp; Hak Akses
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeMember.role === 'owner'
                ? 'Sebagai Pemilik Aplikasi, Anda dapat membuat dan mengelola akun Admin Toko maupun Kasir.'
                : 'Sebagai Admin Toko, Anda dapat membuat dan mengelola akun Kasir untuk operasional toko.'}
            </p>
          </div>

          {creatableRoles.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
              style={{
                backgroundColor: 'var(--brand-primary, #2563EB)',
                color: 'var(--brand-primary-text, #FFFFFF)',
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{activeMember.role === 'owner' ? '+ Tambah Akun Baru' : '+ Tambah Akun Kasir'}</span>
            </button>
          )}
        </div>

        {/* Staff Members List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Daftar Akun Terdaftar ({visibleMembers.length})</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              Otorisasi Bertingkat Aktif
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleMembers.map((m) => {
              const editable = canManageMember(activeMember, m);
              const canToggle = editable && m.id !== activeMember.id;

              return (
                <div
                  key={m.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        m.role === 'owner'
                          ? 'bg-slate-900 text-white'
                          : m.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.fullName.charAt(0)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{m.fullName}</h4>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            m.role === 'owner'
                              ? 'bg-slate-900 text-white'
                              : m.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ROLE_LABELS[m.role]}
                        </span>
                        {m.id === activeMember.id && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Sedang Masuk
                          </span>
                        )}
                        {!m.isActive && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ID Login: <span className="font-mono font-semibold text-slate-700">{m.username || '-'}</span> • PIN: •••••• • Akses:{' '}
                        {m.role === 'owner'
                          ? 'Semua Modul + Branding Toko'
                          : m.role === 'admin'
                          ? 'Kasir, Katalog, Kas, Laba & Kelola Kasir'
                          : 'Kasir, Ubah Stok/Status Menu & Arus Kas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {canToggle && (
                      <button
                        type="button"
                        onClick={() => handleToggleMemberActive(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          m.isActive
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {m.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}

                    {editable && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        aria-label={`Edit profil dan kredensial ${m.fullName}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Akun, Password & PIN"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log Anti-Curang */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Log Aktivitas & Audit Keamanan Kasir</span>
            </h3>
            <span className="text-[11px] text-slate-500">Anti-Curang Otomatis</span>
          </div>

          <div className="p-4">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Belum ada rekaman audit log.
              </p>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.actorName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.description}</p>
                    </div>

                    <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Akun & Hak Akses' : 'Buat Akun Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                aria-label="Tutup form staf"
                className="p-1 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Siti Aisyah"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID Login (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Contoh: admin_toko atau kasir01"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dipakai saat masuk di layar login awal (minimal 3 karakter, tanpa spasi).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password {editingMember ? '(Opsional jika tidak diubah)' : '*'}
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingMember}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      editingMember
                        ? 'Kosongkan jika tetap memakai password lama'
                        : 'Minimal 4 karakter'
                    }
                    className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran / Tingkatan Akses *
                </label>
                {editingMember?.role === 'owner' ? (
                  <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs font-bold text-slate-800">
                    Pemilik Aplikasi (Akses Penuh Seluruh Modul &amp; Branding)
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {creatableRoles.includes('cashier') && (
                      <option value="cashier">
                        Kasir (Terminal POS, Ubah Stok/Status Menu &amp; Arus Kas)
                      </option>
                    )}
                    {creatableRoles.includes('admin') && (
                      <option value="admin">
                        Admin Toko (Semua Operasional Toko &amp; Buat Kasir, tanpa Branding)
                      </option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6-Digit PIN Kunci Layar &amp; Otorisasi *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6 Digit Angka PIN"
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-base font-bold tracking-widest text-slate-900 font-mono"
                />
              </div>

              {/* Granular Kasir Permissions */}
              {role === 'cashier' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-700 uppercase text-[10px]">Izin Khusus Kasir:</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canViewDailyRevenue}
                      onChange={(e) => setCanViewDailyRevenue(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span>Boleh melihat total omzet shift di layar kasir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canDiscount}
                      onChange={(e) => setCanDiscount(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span>Boleh memberi diskon manual tanpa PIN Admin</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canVoidOrder}
                      onChange={(e) => setCanVoidOrder(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span>Boleh membatalkan transaksi (Void)</span>
                  </label>

                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    Kasir otomatis dapat mengubah stok dan status ketersediaan menu di tab Katalog.
                  </p>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

