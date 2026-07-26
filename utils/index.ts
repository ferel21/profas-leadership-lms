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

export function roleHome(role?: string | null) {
  return role ? `/dashboard?view=${role.toLowerCase()}` : "/dashboard";
}

export function formatDate(date:Date|string|number){
  const d = new Date(date);
  return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Makassar"}).format(d);
}
