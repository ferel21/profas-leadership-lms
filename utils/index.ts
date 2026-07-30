export function formatRupiah(value: number) {
  if (value === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function personaLabel(persona?: string | null) {
  const labels: Record<string, string> = {
    STUDENT_ENTREPRENEUR: "Pengusaha UMKM",
    ACADEMIC: "Akademisi/Pendidik",
    ORGANIZATION: "Organisasi",
    COOPERATIVE: "Koperasi",
  };
  return persona ? labels[persona] ?? persona : "Peserta";
}

export function formatDate(date:Date|string|number){
  const d = new Date(date);
  return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Makassar"}).format(d);
}

export function formatRelativeTime(date: Date | string | number | null | undefined) {
  if (!date) return "Belum pernah aktif";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} bulan lalu`;
  return `${Math.floor(diffMonth / 12)} tahun lalu`;
}
