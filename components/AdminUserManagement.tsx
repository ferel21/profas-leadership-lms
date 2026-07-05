/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Shield, Search, Trash2, Loader2, CheckCircle2, AlertTriangle, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "SUPER_ADMIN";
  authProvider: string;
  createdAt: string;
  _count: {
    enrollments: number;
    certificates: number;
    mentoredCourses: number;
  };
};

export function AdminUserManagement({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
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

      setUsers(prev => [data.user, ...prev]);
      setMessage({ type: "success", text: `Akun ${data.user.name} (${data.user.email}) berhasil ditambahkan dan didaftarkan ke kelas!` });
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

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

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      setMessage({ type: "success", text: `Role untuk pengguna berhasil diubah ke ${newRole}!` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${userName}? Semua progres dan data terkait akan dihapus permanen.`)) return;

    setLoadingId(userId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus pengguna");

      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: "success", text: `Akun ${userName} berhasil dihapus.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <article className="data-card glass-card hover-lift" style={{ marginTop: "24px" }}>
      <div className="data-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield className="text-teal-600" size={20} /> Manajemen Pengguna & Hak Akses (Role Access)
          </h2>
          <p>Atur peran pengguna sebagai Peserta, Mentor, atau Super Admin</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "250px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "8px",
              background: "linear-gradient(135deg, #0d9488, #14b8a6)",
              color: "#fff", fontWeight: 700, fontSize: "13px",
              border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(13,148,136,0.25)"
            }}
            className="hover-lift"
          >
            <UserPlus size={16} /> Tambah / Sinkron Akun Google
          </button>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px", padding: "24px",
            width: "100%", maxWidth: "480px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={20} color="#0d9488" /> Tambah / Sinkron Akun
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
              Masukkan nama dan alamat email akun (contoh: akun Google OAuth Anda) agar muncul di dasbor admin dan otomatis terdaftar di kelas kepemimpinan.
            </p>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Nama Lengkap</label>
                <input
                  type="text" required placeholder="Contoh: Keyra Ferel / Nadia"
                  value={newName} onChange={e => setNewName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Alamat Email (Google / Local)</label>
                <input
                  type="email" required placeholder="email.anda@gmail.com"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Peran (Role)</label>
                  <select
                    value={newRole} onChange={e => setNewRole(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 600 }}
                  >
                    <option value="STUDENT">Peserta (STUDENT)</option>
                    <option value="MENTOR">Mentor (MENTOR)</option>
                    <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Metode Login</label>
                  <select
                    value={newProvider} onChange={e => setNewProvider(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 600 }}
                  >
                    <option value="GOOGLE">Google OAuth</option>
                    <option value="LOCAL">Local / Email</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={creating}
                  style={{
                    padding: "10px 20px", borderRadius: "8px",
                    background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                    color: "#fff", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  {creating ? "Menyimpan..." : "Simpan & Daftarkan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: message.type === "success" ? "#166534" : "#b91c1c",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`
        }}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--line)", color: "var(--muted)" }}>
              <th style={{ padding: "12px" }}>Nama Pengguna</th>
              <th style={{ padding: "12px" }}>Email & Provider</th>
              <th style={{ padding: "12px" }}>Statistik Belajar/Mengajar</th>
              <th style={{ padding: "12px" }}>Hak Akses (Role)</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                  Tidak ada pengguna yang cocok dengan pencarian Anda.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: "12px" }}>
                    <div>{u.email}</div>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#475569" }}>
                      {u.authProvider}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>
                    {u.role === "MENTOR" ? (
                      <span>📚 {u._count.mentoredCourses} Program dikelola</span>
                    ) : (
                      <span>📖 {u._count.enrollments} Kelas • 🎓 {u._count.certificates} Sertifikat</span>
                    )}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <select
                      disabled={loadingId === u.id}
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: u.role === "SUPER_ADMIN" ? "#fef3c7" : u.role === "MENTOR" ? "#e0e7ff" : "#f1f5f9",
                        color: u.role === "SUPER_ADMIN" ? "#b45309" : u.role === "MENTOR" ? "#4338ca" : "#334155",
                        cursor: "pointer"
                      }}
                    >
                      <option value="STUDENT">Peserta (STUDENT)</option>
                      <option value="MENTOR">Mentor (MENTOR)</option>
                      <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    {loadingId === u.id ? (
                      <Loader2 size={16} className="animate-spin" style={{ margin: "0 auto", color: "var(--teal)" }} />
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        title="Hapus Akun Pengguna"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
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
