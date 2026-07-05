import { PrismaClient, AssessmentType, ContentType, CourseLevel, EnrollmentStatus, Persona, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const courses = [
  {
    id: "course-leadership-foundation",
    slug: "fondasi-kepemimpinan-berdampak",
    title: "Fondasi Kepemimpinan Berdampak",
    shortDescription: "Bangun pola pikir dan keterampilan inti untuk memimpin diri, tim, dan perubahan.",
    description: "Program intensif berbasis praktik untuk calon pemimpin yang ingin mengembangkan self-leadership, komunikasi, dan pengambilan keputusan yang bertanggung jawab.",
    category: "Kepemimpinan Dasar",
    level: CourseLevel.BASIC,
    price: 499000,
    durationHours: 8,
    rating: 4.9,
    studentsCount: 1248,
    image: "/images/profas-leadership-hero.png",
    featured: true,
    outcomes: JSON.stringify(["Mengenali gaya kepemimpinan personal", "Membangun komunikasi yang menggerakkan", "Mengambil keputusan secara terstruktur"]),
  },
  {
    id: "course-entrepreneur",
    slug: "memimpin-bisnis-yang-tumbuh",
    title: "Memimpin Bisnis yang Tumbuh",
    shortDescription: "Sistem kepemimpinan praktis untuk pemilik UMKM dan manajer tim kecil.",
    description: "Belajar mendelegasikan, membangun ritme eksekusi, dan mengubah tim kecil menjadi mesin pertumbuhan yang sehat.",
    category: "Leadership UMKM",
    level: CourseLevel.INTERMEDIATE,
    price: 749000,
    durationHours: 10,
    rating: 4.8,
    studentsCount: 874,
    image: "/images/profas-leadership-hero.png",
    featured: true,
    outcomes: JSON.stringify(["Mendelegasikan tanpa kehilangan kontrol", "Membangun ritme eksekusi mingguan", "Meningkatkan akuntabilitas tim"]),
  },
  {
    id: "course-strategic",
    slug: "strategic-leadership-masterclass",
    title: "Strategic Leadership Masterclass",
    shortDescription: "Pimpin perubahan organisasi dengan strategi yang tajam dan kolaboratif.",
    description: "Masterclass bagi pemimpin organisasi, akademisi, dan koperasi untuk merancang arah strategis dan mengawal transformasi.",
    category: "Strategic Leadership",
    level: CourseLevel.ADVANCED,
    price: 1299000,
    durationHours: 14,
    rating: 4.9,
    studentsCount: 516,
    image: "/images/profas-leadership-hero.png",
    featured: true,
    outcomes: JSON.stringify(["Merumuskan strategic intent", "Memimpin transformasi lintas fungsi", "Mengukur dampak kepemimpinan"]),
  },
];

async function main() {
  await prisma.xPLog.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.nodeProgress.deleteMany();
  await prisma.courseNode.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("profas123", 10);
  const mentor = await prisma.user.create({
    data: { id: "mentor-ratna", name: "Dr. Ratna Maharani", username: "ratna.maharani", email: "mentor@profas.id", passwordHash, role: Role.MENTOR, headline: "Leadership & Organization Development Facilitator" },
  });
  const student = await prisma.user.create({
    data: { id: "student-nadia", name: "Nadia Pratama", username: "nadia.pratama", email: "peserta@profas.id", passwordHash, role: Role.STUDENT, persona: Persona.STUDENT_ENTREPRENEUR, headline: "Founder, Tumbuh Bersama" },
  });

  await prisma.user.create({
    data: { id: "super-admin", name: "Admin PROFAS", username: "admin.profas", email: "admin@profas.id", passwordHash, role: Role.SUPER_ADMIN, headline: "Platform Administrator" },
  });
  const peers = await Promise.all([
    ["Arief Wibowo", "arief@demo.id", Persona.STUDENT_ENTREPRENEUR],
    ["Siti Rahma", "siti@demo.id", Persona.ACADEMIC],
    ["Dimas Putra", "dimas@demo.id", Persona.STUDENT_ENTREPRENEUR],
    ["Maya Lestari", "maya@demo.id", Persona.ACADEMIC],
  ].map(([name, email, persona], i) => prisma.user.create({ data: { id: `peer-${i}`, name: String(name), email: String(email), passwordHash, role: Role.STUDENT, persona: persona as Persona } })));

  for (const courseData of courses) {
    const course = await prisma.course.create({ data: { ...courseData, mentorId: mentor.id, published: true } });
    const moduleTitles = course.id === "course-leadership-foundation"
      ? ["Memimpin Diri", "Memimpin Percakapan", "Memimpin Keputusan"]
      : ["Membangun Arah", "Menggerakkan Tim", "Menjaga Dampak"];
    for (let m = 0; m < moduleTitles.length; m++) {
      const folder = await prisma.courseNode.create({ data: { courseId: course.id, title: moduleTitles[m], description: `Prinsip dan praktik ${moduleTitles[m].toLowerCase()}.`, type: "FOLDER", order: m + 1 } });
      for (let l = 0; l < 3; l++) {
        const type = l === 1 ? ContentType.TEXT : ContentType.VIDEO;
        await prisma.courseNode.create({
          data: { courseId: course.id, parentId: folder.id, title: ["Konsep Inti", "Praktik Reflektif", "Studi Kasus"][l], type: type, order: l + 1, durationMin: 8 + l * 4, content: l === 1 ? "Kepemimpinan dimulai dari kemampuan membaca situasi, mengenali pola diri, dan memilih respons yang paling bertanggung jawab. Gunakan jurnal refleksi untuk menghubungkan konsep hari ini dengan tantangan nyata Anda." : null, fileUrl: l !== 1 ? "https://www.youtube.com/embed/ysz5S6PUM-U" : null },
        });
      }
      if (course.id === "course-leadership-foundation") {
        const evaluation = await prisma.assessment.create({ data: { courseId: course.id, title: `Evaluasi ${moduleTitles[m]}`, type: AssessmentType.MODULE, passingScore: 70, timeLimitMin: 10 } });
        await prisma.courseNode.update({ where: { id: folder.id }, data: { assessmentId: evaluation.id } });
        const qs = [
          ["Apa langkah pertama seorang pemimpin sebelum menentukan tindakan?", ["Membaca situasi dan tujuan", "Membagi seluruh pekerjaan", "Menunggu arahan", "Menghindari konflik"], 0],
          ["Komunikasi kepemimpinan yang efektif terutama bertujuan untuk…", ["Menunjukkan jabatan", "Menciptakan kejelasan dan komitmen", "Memperpanjang rapat", "Menghindari umpan balik"], 1],
          ["Keputusan yang bertanggung jawab perlu mempertimbangkan…", ["Kecepatan saja", "Opini mayoritas saja", "Dampak, data, dan nilai", "Preferensi pribadi"], 2],
        ] as const;
        await Promise.all(qs.map((q, i) => prisma.assessmentQuestion.create({ data: { assessmentId: evaluation.id, prompt: q[0], options: JSON.stringify(q[1]), correctAnswer: String(q[2]), explanation: "Jawaban terbaik menghubungkan kesadaran situasi dengan dampak tindakan.", order: i + 1, type: "MULTIPLE_CHOICE" } })));
      }
    }
    if (course.id === "course-leadership-foundation") {
      const pretest = await prisma.assessment.create({ data: { courseId: course.id, title: "Pretest Kepemimpinan", type: AssessmentType.PRETEST, passingScore: 0, timeLimitMin: 12 } });
      await prisma.assessmentQuestion.createMany({ data: [
        { assessmentId: pretest.id, prompt: "Ketika tim kehilangan arah, respons pertama Anda adalah…", options: JSON.stringify(["Memperjelas tujuan bersama", "Mengambil alih semua tugas", "Menunggu situasi membaik", "Mencari siapa yang salah"]), correctAnswer: "0", order: 1, type: "MULTIPLE_CHOICE" },
        { assessmentId: pretest.id, prompt: "Umpan balik yang sehat sebaiknya…", options: JSON.stringify(["Ditunda", "Spesifik dan berorientasi perbaikan", "Disampaikan di depan umum", "Hanya berisi pujian"]), correctAnswer: "1", order: 2, type: "MULTIPLE_CHOICE" },
        { assessmentId: pretest.id, prompt: "Indikator keputusan berkualitas adalah…", options: JSON.stringify(["Tidak ada yang protes", "Cepat dibuat", "Selaras tujuan dan dapat dipertanggungjawabkan", "Disukai atasan"]), correctAnswer: "2", order: 3, type: "MULTIPLE_CHOICE" },
      ] });
    }
  }

  await prisma.enrollment.createMany({ data: [
    { userId: student.id, courseId: courses[0].id, status: EnrollmentStatus.ACTIVE, progressPercent: 67 },
    { userId: student.id, courseId: courses[1].id, status: EnrollmentStatus.ACTIVE, progressPercent: 22 },
    { userId: student.id, courseId: courses[2].id, status: EnrollmentStatus.COMPLETED, progressPercent: 100, completedAt: new Date("2026-06-18") },
  ] });

  const [foundationLessons,businessLessons,strategicLessons] = await Promise.all(courses.map(course=>prisma.courseNode.findMany({ where: { courseId: course.id, type: { not: "FOLDER" } }, orderBy: [{ parent: { order: "asc" } }, { order: "asc" }] })));
  const completedLessons=[...foundationLessons.slice(0,6),...businessLessons.slice(0,2),...strategicLessons];
  await prisma.nodeProgress.createMany({ data: completedLessons.map((node) => ({ userId: student.id, nodeId: node.id })) });
  await prisma.xPLog.createMany({ data: [
    { userId: student.id, points: 320, source: "SEED", sourceId: "nadia" },
    { userId: peers[0].id, points: 760, source: "SEED", sourceId: "arief" },
    { userId: peers[1].id, points: 645, source: "SEED", sourceId: "siti" },
    { userId: peers[2].id, points: 580, source: "SEED", sourceId: "dimas" },
    { userId: peers[3].id, points: 445, source: "SEED", sourceId: "maya" },
  ] });
  await prisma.certificate.create({ data: { userId: student.id, courseId: courses[2].id, uniqueNumber: "PROFAS-LDR-2026-SLM-0001", issuedAt: new Date("2026-06-18") } });

  // 1. Forum Seed
  await prisma.forumCategory.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.forumReply.deleteMany();
  const catUmum = await prisma.forumCategory.create({ data: { name: "Diskusi Umum", description: "Tempat berbagi tentang kepemimpinan sehari-hari", order: 1 } });
  const catTanya = await prisma.forumCategory.create({ data: { name: "Tanya Mentor", description: "Tanya langsung dengan mentor PROFAS", order: 2 } });
  
  const thread1 = await prisma.forumThread.create({ data: { categoryId: catUmum.id, authorId: peers[0].id, title: "Cara terbaik menangani anggota tim yang demotivasi?", content: "Ada saran untuk menghadapi karyawan yang tiba-tiba turun kinerjanya?", pinned: true } });
  await prisma.forumReply.create({ data: { threadId: thread1.id, authorId: mentor.id, content: "Lakukan sesi 1-on-1 mendalam untuk mencari akar masalahnya." } });

  // 2. Calendar Event Seed
  await prisma.calendarEvent.deleteMany();
  await prisma.calendarEvent.createMany({ data: [
    { title: "Live Q&A Leadership Foundation", startTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), endTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 3600000), courseId: courses[0].id },
    { title: "Batas Kumpul Evaluasi Strategic", startTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), endTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 3600000), courseId: courses[2].id }
  ]});

  // 3. Badges Seed
  await prisma.badge.deleteMany();
  await prisma.userBadge.deleteMany();
  const b1 = await prisma.badge.create({ data: { name: "First Steps", description: "Selesaikan 1 lesson pertama", imageUrl: "/badges/default.png", criteria: "LESSONS_COMPLETED:1" } });
  await prisma.forumThread.create({ data: { categoryId: catTanya.id, authorId: peers[0].id, title: "Tanya seputar Modul 2", content: "Halo Mentor!" } });
  const b2 = await prisma.badge.create({ data: { name: "Penanya Aktif", description: "Membuat 5 pertanyaan", imageUrl: "/badges/ask.png", criteria: "XP_EARNED:1000" } });
  
  await prisma.userBadge.create({ data: { userId: peers[0].id, badgeId: b2.id } });
  await prisma.userBadge.create({ data: { userId: student.id, badgeId: b1.id } });
}

main().then(() => console.log("Database PROFAS siap."))
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
