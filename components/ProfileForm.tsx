"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign, BriefcaseBusiness, Camera, CheckCircle2, LoaderCircle,
  Mail, MapPin, Pencil, Phone, RotateCcw, ShieldCheck, UserRound, XCircle,
} from "lucide-react";
import { initials } from "@/lib/utils";

type ProfileData = {
  name: string;
  username: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  organization: string;
  location: string;
  persona: string | null;
};

type ProfileUser = ProfileData & {
  id: string;
  role: string;
  avatar: string | null;
};

type FieldErrors = Partial<Record<keyof ProfileData, string[]>>;

const roleLabels: Record<string, string> = {
  STUDENT: "Peserta",
  MENTOR: "Mentor",
  SUPER_ADMIN: "Admin",
};

const personaOptions = [
  ["STUDENT_ENTREPRENEUR", "Pengusaha UMKM"],
  ["ACADEMIC", "Akademisi / Pendidik"],
  ["ORGANIZATION", "Organisasi"],
  ["COOPERATIVE", "Koperasi"],
] as const;

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<ProfileData>(() => toProfile(user));
  const [form, setForm] = useState<ProfileData>(() => toProfile(user));
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const avatarSrc = preview ?? avatar;
  const roleLabel = roleLabels[user.role] ?? user.role;
  const completeness = useMemo(() => {
    const values = [form.name, form.username, form.email, form.phone, form.headline, form.bio, form.organization, form.location];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  }, [form]);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
    setNotice(null);
  }

  function chooseAvatar(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ type: "error", text: "Foto harus berformat JPG, PNG, atau WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", text: "Ukuran foto maksimal 5MB." });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
    setNotice(null);
  }

  function cancel() {
    setForm(original);
    setAvatarFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setErrors({});
    setNotice(null);
    setEditing(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    const payload = {
      ...form,
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.replace(/[\s()-]/g, ""),
    };

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.fieldErrors ?? {});
        throw new Error(result.error ?? "Profil gagal diperbarui.");
      }

      const saved = toProfile(result.user);
      setOriginal(saved);
      setForm(saved);
      let nextAvatar = avatar;
      if (avatarFile) {
        const avatarBody = new FormData();
        avatarBody.append("avatar", avatarFile);
        const avatarResponse = await fetch("/api/settings/avatar", { method: "POST", body: avatarBody });
        const avatarResult = await avatarResponse.json().catch(() => ({}));
        if (!avatarResponse.ok) throw new Error(`${result.message} Namun, ${avatarResult.error ?? "foto gagal diunggah."}`);
        nextAvatar = avatarResult.avatar;
      }

      setAvatar(nextAvatar);
      setAvatarFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setEditing(false);
      setNotice({ type: "success", text: "Profil berhasil diperbarui dan sudah berlaku di seluruh LMS." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Profil gagal diperbarui." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-shell">
      <aside className="profile-summary data-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {avatarSrc ? <img src={avatarSrc} alt={`Foto profil ${form.name}`} /> : <span>{initials(form.name)}</span>}
          </div>
          {editing && <button type="button" className="avatar-camera" onClick={() => fileRef.current?.click()} aria-label="Pilih foto profil"><Camera /></button>}
        </div>
        <h2>{form.name}</h2>
        <p className="profile-handle">@{form.username || "nama.akun"}</p>
        <span className={`role-pill role-${user.role.toLowerCase()}`}><ShieldCheck /> {roleLabel}</span>
        <div className="profile-completeness">
          <div><span>Kelengkapan profil</span><b>{completeness}%</b></div>
          <i><span style={{ width: `${completeness}%` }} /></i>
        </div>
        <p className="profile-role-note">Role dikelola oleh admin untuk menjaga keamanan hak akses akun.</p>
      </aside>

      <form className="profile-editor data-card" onSubmit={submit} noValidate>
        <div className="profile-editor-head">
          <div><span className="eyebrow">INFORMASI AKUN</span><h2>Profil pengguna</h2><p>Data ini digunakan pada dashboard, course, sertifikat, laporan, dan aktivitas belajar.</p></div>
          {!editing && <button type="button" className="btn btn-outline profile-edit-btn" onClick={() => { setEditing(true); setNotice(null); }}><Pencil /> Edit profil</button>}
        </div>

        {notice && <div className={`profile-notice ${notice.type}`} role="status">{notice.type === "success" ? <CheckCircle2 /> : <XCircle />}<span>{notice.text}</span></div>}

        <div className="avatar-upload-row">
          <div><b>Foto profil</b><p>JPG, PNG, atau WebP. Ukuran maksimal 5MB.</p></div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => chooseAvatar(event.target.files?.[0])} hidden />
          <button type="button" className="btn btn-outline btn-small" onClick={() => fileRef.current?.click()} disabled={!editing || saving}><Camera /> {avatarFile ? "Ganti foto" : "Upload foto"}</button>
        </div>

        <div className="profile-fields">
          <Field icon={<UserRound />} label="Nama lengkap" error={errors.name?.[0]}>
            <input value={form.name} onChange={e => update("name", e.target.value)} minLength={2} maxLength={80} disabled={!editing || saving} required />
          </Field>
          <Field icon={<AtSign />} label="Nama akun" hint="Huruf kecil, angka, titik, _ atau -" error={errors.username?.[0]}>
            <div className="input-prefix"><span>@</span><input value={form.username} onChange={e => update("username", e.target.value.toLowerCase().replace(/\s/g, ""))} minLength={3} maxLength={30} disabled={!editing || saving} required /></div>
          </Field>
          <Field icon={<Mail />} label="Email" error={errors.email?.[0]}>
            <input type="email" value={form.email} onChange={e => update("email", e.target.value)} maxLength={120} disabled={!editing || saving} required />
          </Field>
          <Field icon={<Phone />} label="Nomor telepon" hint="Contoh: +6281234567890" error={errors.phone?.[0]}>
            <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} maxLength={20} disabled={!editing || saving} placeholder="+6281234567890" />
          </Field>
          <Field icon={<BriefcaseBusiness />} label={user.role === "MENTOR" ? "Keahlian / jabatan" : "Jabatan"} error={errors.headline?.[0]}>
            <input value={form.headline} onChange={e => update("headline", e.target.value)} maxLength={100} disabled={!editing || saving} placeholder="Contoh: Founder atau Leadership Coach" />
          </Field>
          <Field icon={<BriefcaseBusiness />} label="Organisasi / institusi" error={errors.organization?.[0]}>
            <input value={form.organization} onChange={e => update("organization", e.target.value)} maxLength={100} disabled={!editing || saving} placeholder="Nama perusahaan atau institusi" />
          </Field>
          <Field icon={<MapPin />} label="Lokasi" error={errors.location?.[0]}>
            <input value={form.location} onChange={e => update("location", e.target.value)} maxLength={100} disabled={!editing || saving} placeholder="Kota, provinsi" />
          </Field>
          {user.role === "STUDENT" && <Field icon={<UserRound />} label="Profil peserta" error={errors.persona?.[0]}>
            <select value={form.persona ?? ""} onChange={e => update("persona", e.target.value || null)} disabled={!editing || saving}>
              <option value="">Pilih profil peserta</option>
              {personaOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>}
          <Field wide icon={<Pencil />} label="Bio singkat" hint={`${form.bio.length}/300 karakter`} error={errors.bio?.[0]}>
            <textarea value={form.bio} onChange={e => update("bio", e.target.value)} maxLength={300} rows={4} disabled={!editing || saving} placeholder={user.role === "MENTOR" ? "Ceritakan keahlian dan pengalaman Anda sebagai mentor." : "Ceritakan sedikit tentang diri dan tujuan belajar Anda."} />
          </Field>
        </div>

        {editing && <div className="profile-actions">
          <button type="button" className="btn btn-outline" onClick={cancel} disabled={saving}><RotateCcw /> Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Menyimpan...</> : <><CheckCircle2 /> Simpan perubahan</>}</button>
        </div>}
      </form>
    </div>
  );
}

function Field({ label, icon, hint, error, wide, children }: { label: string; icon: ReactNode; hint?: string; error?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`profile-field ${wide ? "wide" : ""} ${error ? "has-error" : ""}`}>
    <span className="profile-label">{icon}{label}{hint && <small>{hint}</small>}</span>
    {children}
    {error && <span className="field-error">{error}</span>}
  </label>;
}

function toProfile(user: Partial<ProfileUser>): ProfileData {
  return {
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    organization: user.organization ?? "",
    location: user.location ?? "",
    persona: user.persona ?? null,
  };
}
