/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Shield, Search, Trash2, Loader2, CheckCircle2, AlertTriangle, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "SUPER_ADMIN" | string;
  authProvider: string;
  createdAt: string;
  _count?: {
    enrollments?: number;
    certificates?: number;
    mentoredCourses?: number;
  };
};

export function AdminUserManagement({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers || []);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("STUDENT");
  const [newProvider, setNewProvider] = useState("GOOGLE");
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, role: newRole, authProvider: newProvider })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambah pengguna");

      const newUser: AdminUserRow = {
        ...data.user,
        _count: data.user._count || { enrollments: 0, certificates: 0, mentoredCourses: 0 }
      };

      setUsers(prev => [newUser, ...prev]);
      setMessage({ type: "success", text: `Akun ${data.user.name} (${data.user.email}) berhasil ditambahkan dan didaftarkan ke kelas!` });
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan sistem" });
    } finally {
      setCreating(false);
    }
  };

  const safeUsers = users || [];
  const filteredUsers = safeUsers.filter(u => {
    const nameStr = (u.name || "").toLowerCase();
    const emailStr = (u.email || "").toLowerCase();
    const roleStr = (u.role || "").toLowerCase();
    const providerStr = (u.authProvider || "").toLowerCase();
    const queryStr = search.toLowerCase();
    return nameStr.includes(queryStr) || emailStr.includes(queryStr) || roleStr.includes(queryStr) || providerStr.includes(queryStr);
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah role");

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage({ type: "success", text: `Role untuk pengguna berhasil diubah ke ${newRole}!` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat mengubah role" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${userName || "pengguna ini"}? Semua progres dan data terkait akan dihapus permanen.`)) return;

    setLoadingId(userId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus pengguna");

      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: "success", text: `Akun ${userName || "pengguna"} berhasil dihapus.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat menghapus akun" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <article className="data-card mt-8 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-[0_10px_30px_-10px_rgba(13,148,136,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="flex items-center gap-2.5 text-xl font-bold text-slate-900 tracking-tight">
            <Shield className="text-teal-600 shrink-0" size={22} />
            <span>Manajemen Pengguna & Hak Akses (Role Access)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Atur peran pengguna sebagai Peserta (STUDENT), Mentor (MENTOR), atau Super Admin (SUPER_ADMIN)</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition shrink-0 hover-lift"
          >
            <UserPlus size={16} className="shrink-0" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-teal-600" />
                <span>Tambah / Sinkron Akun</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Masukkan nama dan alamat email akun agar terdaftar di sistem dan langsung memiliki akses ke kurikulum LMS.
            </p>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text" required placeholder="Contoh: Keyra Ferel / Nadia Pratama"
                  value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Alamat Email</label>
                <input
                  type="email" required placeholder="email.anda@gmail.com"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Peran (Role)</label>
                  <select
                    value={newRole} onChange={e => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="STUDENT">Peserta (STUDENT)</option>
                    <option value="MENTOR">Mentor (MENTOR)</option>
                    <option value="SUPER_ADMIN">Super Admin (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Metode Login</label>
                  <select
                    value={newProvider} onChange={e => setNewProvider(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="GOOGLE">Google OAuth</option>
                    <option value="LOCAL">Local / Email</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={creating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  <span>{creating ? "Menyimpan..." : "Simpan Akun"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-3.5 rounded-xl mb-5 text-sm flex items-center gap-3 font-medium border ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <th className="py-3.5 px-4">Nama Pengguna</th>
              <th className="py-3.5 px-4">Email & Provider</th>
              <th className="py-3.5 px-4">Statistik Aktivitas</th>
              <th className="py-3.5 px-4">Hak Akses (Role)</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 bg-slate-50/30">
                  <p className="font-medium text-slate-500">Tidak ada pengguna yang cocok dengan pencarian Anda.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.name || "Tanpa Nama"}</td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 font-medium">{u.email || "-"}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      {u.authProvider || "LOCAL"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                    {u.role === "MENTOR" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                        {(u._count?.mentoredCourses ?? 0)} Program dikelola
                      </span>
                    ) : u.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold">
                        Akses Penuh Sistem
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-slate-600 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">{(u._count?.enrollments ?? 0)} Kelas</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{(u._count?.certificates ?? 0)} Sertifikat</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      disabled={loadingId === u.id}
                      value={u.role || "STUDENT"}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer focus:outline-none ${
                        u.role === "SUPER_ADMIN"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : u.role === "MENTOR"
                          ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                          : "bg-slate-100 text-slate-800 border-slate-300"
                      }`}
                    >
                      <option value="STUDENT">Peserta (STUDENT)</option>
                      <option value="MENTOR">Mentor (MENTOR)</option>
                      <option value="SUPER_ADMIN">Super Admin (ADMIN)</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {loadingId === u.id ? (
                      <Loader2 size={16} className="animate-spin mx-auto text-teal-600" />
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        title="Hapus Akun Pengguna"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
