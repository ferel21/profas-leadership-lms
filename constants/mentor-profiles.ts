export interface MentorProfile {
  readonly id: "muhammad-asdar" | "firman-menne" | "bahrul-ulum-ilham";
  readonly name: string;
  readonly role: string;
  readonly credentials: readonly string[];
  readonly image: string;
  readonly imageAlt: string;
  readonly aliases: readonly string[];
}

export const MENTOR_PROFILES = [
  {
    id: "muhammad-asdar",
    name: "Prof. Dr. Muhammad Asdar, S.E., M.Si.",
    role: "Guru Besar Fakultas Ekonomi dan Bisnis Universitas Hasanuddin",
    credentials: [
      "Lulusan S1 hingga S3 di bidang ekonomi dan manajemen.",
      "Anggota Dewan Profesor Universitas Hasanuddin periode 2022–2026.",
      "Mantan Rektor Universitas Cokroaminoto Makassar.",
    ],
    image: "/images/mentor-1.png",
    imageAlt: "Potret Prof. Dr. Muhammad Asdar, mentor Leadership PROFAS",
    aliases: ["Muhammad Asdar", "Prof. Dr. Muhammad Asdar"],
  },
  {
    id: "firman-menne",
    name: "Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA",
    role: "Guru Besar Ilmu Akuntansi di Universitas Bosowa",
    credentials: [
      "Pernah menjabat berbagai posisi strategis, termasuk Wakil Rektor Universitas Bosowa.",
      "Memiliki pengalaman riset internasional di Australia.",
      "Penulis aktif berbagai buku referensi utama akuntansi syariah.",
    ],
    image: "/images/mentor-2.png",
    imageAlt: "Potret Prof. Dr. Firman Menne, mentor Personal Growth PROFAS",
    aliases: ["Firman Menne", "Prof. Dr. Firman Menne"],
  },
  {
    id: "bahrul-ulum-ilham",
    name: "Bahrul Ulum Ilham, S.Pd., M.M., Ph.D.",
    role: "Akademisi ITB Nobel Indonesia dan Koordinator Konsultan PLUT Sulawesi Selatan",
    credentials: [
      "Meraih gelar Ph.D. Manajemen dari Universiti Kuala Lumpur pada tahun 2025.",
      "Ketua Umum DPN Asosiasi Business Development Services Indonesia (ABDSI) 2026–2030.",
      "Asesor BNSP bidang UMKM dan Certified Trainer dari ILO.",
    ],
    image: "/images/mentor-3.png",
    imageAlt: "Potret Bahrul Ulum Ilham, mentor Business & Entrepreneurship PROFAS",
    aliases: ["Bahrul Ulum Ilham"],
  },
] as const satisfies readonly MentorProfile[];

function normalizeMentorName(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findMentorProfile(name: string | null | undefined): MentorProfile | undefined {
  if (!name?.trim()) return undefined;

  const normalizedName = normalizeMentorName(name);

  return MENTOR_PROFILES.find((profile) =>
    [profile.name, ...profile.aliases].some((candidate) => {
      const normalizedCandidate = normalizeMentorName(candidate);
      return normalizedName === normalizedCandidate || normalizedName.includes(normalizedCandidate);
    }),
  );
}

export function extractMentorName(description: string | null | undefined): string | null {
  if (!description) return null;
  return description.match(/oleh (.+?) —/)?.[1]?.trim() ?? null;
}
