'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  History,
  Check,
  X,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { StoreMember, AuditLog } from '@/core/types';
import { db } from '@/core/db';
import { useAppStore } from '@/core/store';
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
  const [role, setRole] = useState<'owner' | 'admin' | 'cashier'>('cashier');
  const [pinCode, setPinCode] = useState('');
  const [canDiscount, setCanDiscount] = useState(false);
  const [canOpenPrice, setCanOpenPrice] = useState(false);
  const [canViewDailyRevenue, setCanViewDailyRevenue] = useState(true);
  const [canVoidOrder, setCanVoidOrder] = useState(false);

  const loadData = async () => {
    const mems = await db.members.toArray();
    const logs = await db.auditLogs.orderBy('createdAt').reverse().limit(30).toArray();
    setMembers(mems);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFullName('');
    setRole('cashier');
    setPinCode('');
    setCanDiscount(false);
    setCanOpenPrice(false);
    setCanViewDailyRevenue(true);
    setCanVoidOrder(false);
    setIsMemberModalOpen(true);
  };

  const handleOpenEdit = (m: StoreMember) => {
    setEditingMember(m);
    setFullName(m.fullName);
    setRole(m.role);
    setPinCode(m.pinCode);
    setCanDiscount(m.permissions.canDiscount);
    setCanOpenPrice(m.permissions.canOpenPrice);
    setCanViewDailyRevenue(m.permissions.canViewDailyRevenue);
    setCanVoidOrder(m.permissions.canVoidOrder);
    setIsMemberModalOpen(true);
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Nama staf wajib diisi.');
      return;
    }
    if (pinCode.length !== 6 || isNaN(Number(pinCode))) {
      alert('PIN wajib terdiri dari 6 angka.');
      return;
    }

    const perms = {
      canDiscount,
      canOpenPrice,
      canViewDailyRevenue,
      canVoidOrder,
      canManageCatalog: role === 'owner' || role === 'admin',
      canManageExpenses: true,
    };

    if (editingMember) {
      await db.members.update(editingMember.id, {
        fullName: fullName.trim(),
        role,
        pinCode,
        permissions: perms,
      });
    } else {
      await db.members.add({
        id: `member-${Date.now()}`,
        storeId: branding.id,
        fullName: fullName.trim(),
        role,
        pinCode,
        isActive: true,
        permissions: perms,
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
    await db.members.update(m.id, {
      isActive: !m.isActive,
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
                Kelola Staf, Peran & Hak Akses
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Atur hak akses kasir demi mencegah kecurangan dan kebocoran kas usaha.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--brand-primary, #2563EB)',
              color: 'var(--brand-primary-text, #FFFFFF)',
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Staf Baru</span>
          </button>
        </div>

        {/* Staff Members List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Daftar Akun Kasir & Admin</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      m.role === 'owner' || m.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {m.fullName.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{m.fullName}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          m.role === 'owner' || m.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.role}
                      </span>
                      {!m.isActive && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PIN: •••••• ({m.pinCode}) • Akses:{' '}
                      {m.role === 'owner' ? 'Semua Modul' : 'Kasir + Kas Laci'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
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

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(m)}
                    aria-label={`Edit profil dan PIN ${m.fullName}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Profil & PIN"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Data Staf' : 'Tambah Staf / Kasir Baru'}
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

            <form onSubmit={handleSubmitMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Staf *
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
                  Peran / Level Akses *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'cashier')}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="cashier">Kasir (Akses Terbatas Terminal & Kas Laci)</option>
                  <option value="admin">Admin / Supervisor (Bisa Akses Katalog & Audit)</option>
                  <option value="owner">Owner / Pemilik (Akses Penuh Seluruh Modul)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6-Digit PIN Kasir *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6 Digit Angka PIN (misal: 112233)"
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
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

