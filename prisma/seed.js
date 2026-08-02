"use strict";

// prisma/seed.ts
var import_client = require("@prisma/client");
var runningOnVercel = ["1", "true", "yes"].includes((process.env.VERCEL ?? "").trim().toLowerCase());
var productionSeedRequested = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" || runningOnVercel;
if (productionSeedRequested && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error(
    "Seed production diblokir. Gunakan database development/staging, atau set ALLOW_PRODUCTION_SEED=true hanya setelah backup dan persetujuan eksplisit."
  );
}
var prisma = new import_client.PrismaClient();
var COURSE_ID = "course-profas-leadership";
var courseData = {
  id: COURSE_ID,
  slug: "profas-leadership",
  title: "PROFAS LEADERSHIP",
  shortDescription: "Paket lengkap kepemimpinan: Leadership, Personal Growth, dan Business & Entrepreneurship dari 3 profesor terbaik.",
  description: "Program intensif yang memadukan tiga pilar utama \u2014 kepemimpinan, pertumbuhan diri, dan kewirausahaan \u2014 dalam satu paket pembelajaran terstruktur. Dipandu langsung oleh akademisi dan praktisi berpengalaman.",
  category: "Leadership Program",
  level: import_client.CourseLevel.INTERMEDIATE,
  price: 499e3,
  enrollmentMode: import_client.EnrollmentMode.CODE,
  durationHours: 24,
  rating: 4.9,
  studentsCount: 2500,
  image: "/images/profas-leadership-hero.webp",
  featured: true,
  outcomes: JSON.stringify([
    "Menguasai prinsip kepemimpinan yang adaptif dan situasional",
    "Membangun mindset pertumbuhan dan resiliensi personal",
    "Merancang dan menjalankan strategi bisnis yang berkelanjutan",
    "Menggerakkan tim dengan komunikasi dan visi yang jelas",
    "Mengintegrasikan kepemimpinan, pengembangan diri, dan kewirausahaan"
  ])
};
var modules = [
  {
    title: "LEADERSHIP",
    mentorName: "Prof. Dr. Muhammad Asdar, S.E., M.Si.",
    mentorId: "mentor-asdar",
    mentorEmail: "asdar@profas.id",
    mentorUsername: "muhammad.asdar",
    mentorHeadline: "Profesor Manajemen & Kepemimpinan Organisasi",
    description: "Modul kepemimpinan oleh Prof. Dr. Muhammad Asdar, S.E., M.Si. \u2014 Membangun fondasi kepemimpinan yang adaptif, situasional, dan berdampak.",
    lessons: [
      { title: "Fondasi Kepemimpinan Situasional", type: import_client.NodeType.VIDEO, durationMin: 15 },
      { title: "Refleksi: Gaya Kepemimpinan Anda", type: import_client.NodeType.TEXT, durationMin: 10 },
      { title: "Studi Kasus: Memimpin Perubahan", type: import_client.NodeType.VIDEO, durationMin: 12 }
    ]
  },
  {
    title: "PERSONAL GROWTH",
    mentorName: "Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA",
    mentorId: "mentor-firman",
    mentorEmail: "firman@profas.id",
    mentorUsername: "firman.menne",
    mentorHeadline: "Profesor Akuntansi & Pengembangan Diri Profesional",
    description: "Modul pertumbuhan diri oleh Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA \u2014 Membangun mindset bertumbuh, resiliensi, dan kebiasaan produktif.",
    lessons: [
      { title: "Mindset Bertumbuh untuk Pemimpin", type: import_client.NodeType.VIDEO, durationMin: 14 },
      { title: "Refleksi: Pola Kebiasaan Produktif", type: import_client.NodeType.TEXT, durationMin: 10 },
      { title: "Studi Kasus: Resiliensi dalam Tekanan", type: import_client.NodeType.VIDEO, durationMin: 12 }
    ]
  },
  {
    title: "BUSINESS & ENTREPRENEURSHIP",
    mentorName: "Bahrul Ulum Ilham, S.Pd., M.M., Ph.D.",
    mentorId: "mentor-bahrul",
    mentorEmail: "bahrul@profas.id",
    mentorUsername: "bahrul.ilham",
    mentorHeadline: "Akademisi & Praktisi Kewirausahaan",
    description: "Modul bisnis & kewirausahaan oleh Bahrul Ulum Ilham, S.Pd., M.M., Ph.D. \u2014 Merancang strategi bisnis, eksekusi, dan pertumbuhan berkelanjutan.",
    lessons: [
      { title: "Strategi Bisnis Berkelanjutan", type: import_client.NodeType.VIDEO, durationMin: 15 },
      { title: "Refleksi: Model Bisnis Anda", type: import_client.NodeType.TEXT, durationMin: 10 },
      { title: "Studi Kasus: Scaling UMKM", type: import_client.NodeType.VIDEO, durationMin: 14 }
    ]
  }
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
  const passwordHash = "$2b$10$b0MIInWe6SW5JYShtRuW8.wQH1cx3NCnOZ0g5qHknrfsufJkYiMoi";
  const mentors = await Promise.all(
    modules.map(
      (mod) => prisma.user.create({
        data: {
          id: mod.mentorId,
          name: mod.mentorName,
          username: mod.mentorUsername,
          email: mod.mentorEmail,
          passwordHash,
          role: import_client.Role.MENTOR,
          headline: mod.mentorHeadline
        }
      })
    )
  );
  const student = await prisma.user.create({
    data: { id: "student-nadia", name: "Nadia Pratama", username: "nadia.pratama", email: "peserta@profas.id", passwordHash, role: import_client.Role.STUDENT, persona: import_client.Persona.STUDENT_ENTREPRENEUR, headline: "Founder, Tumbuh Bersama" }
  });
  await prisma.user.create({
    data: { id: "super-admin", name: "Admin PROFAS", username: "admin.profas", email: "admin@profas.id", passwordHash, role: import_client.Role.SUPER_ADMIN, headline: "Platform Administrator" }
  });
  const peers = await Promise.all([
    ["Arief Wibowo", "arief@demo.id", import_client.Persona.STUDENT_ENTREPRENEUR],
    ["Siti Rahma", "siti@demo.id", import_client.Persona.ACADEMIC],
    ["Dimas Putra", "dimas@demo.id", import_client.Persona.STUDENT_ENTREPRENEUR],
    ["Maya Lestari", "maya@demo.id", import_client.Persona.ACADEMIC]
  ].map(([name, email, persona], i) => prisma.user.create({ data: { id: `peer-${i}`, name: String(name), email: String(email), passwordHash, role: import_client.Role.STUDENT, persona } })));
  const course = await prisma.course.create({
    data: { ...courseData, mentorId: mentors[0].id, published: true }
  });
  for (let m = 0; m < modules.length; m++) {
    const mod = modules[m];
    const folder = await prisma.courseNode.create({
      data: {
        courseId: course.id,
        title: mod.title,
        description: mod.description,
        type: "FOLDER",
        order: m + 1
      }
    });
    for (let l = 0; l < mod.lessons.length; l++) {
      const lesson = mod.lessons[l];
      await prisma.courseNode.create({
        data: {
          courseId: course.id,
          parentId: folder.id,
          title: lesson.title,
          type: lesson.type,
          order: l + 1,
          durationMin: lesson.durationMin,
          content: lesson.type === import_client.NodeType.TEXT ? "Kepemimpinan dimulai dari kemampuan membaca situasi, mengenali pola diri, dan memilih respons yang paling bertanggung jawab. Gunakan jurnal refleksi untuk menghubungkan konsep hari ini dengan tantangan nyata Anda." : null,
          fileUrl: lesson.type !== import_client.NodeType.TEXT ? "https://www.youtube.com/embed/ysz5S6PUM-U" : null
        }
      });
    }
    const evaluation = await prisma.assessment.create({
      data: {
        courseId: course.id,
        title: `Evaluasi ${mod.title}`,
        type: import_client.AssessmentType.MODULE,
        passingScore: 70,
        timeLimitMin: 10
      }
    });
    await prisma.courseNode.update({ where: { id: folder.id }, data: { assessmentId: evaluation.id } });
    const qs = [
      ["Apa langkah pertama seorang pemimpin sebelum menentukan tindakan?", ["Membaca situasi dan tujuan", "Membagi seluruh pekerjaan", "Menunggu arahan", "Menghindari konflik"], 0],
      ["Komunikasi kepemimpinan yang efektif terutama bertujuan untuk\u2026", ["Menunjukkan jabatan", "Menciptakan kejelasan dan komitmen", "Memperpanjang rapat", "Menghindari umpan balik"], 1],
      ["Keputusan yang bertanggung jawab perlu mempertimbangkan\u2026", ["Kecepatan saja", "Opini mayoritas saja", "Dampak, data, dan nilai", "Preferensi pribadi"], 2]
    ];
    await Promise.all(qs.map((q, i) => prisma.assessmentQuestion.create({ data: { assessmentId: evaluation.id, prompt: q[0], options: JSON.stringify(q[1]), correctAnswer: String(q[2]), explanation: "Jawaban terbaik menghubungkan kesadaran situasi dengan dampak tindakan.", order: i + 1, type: "MULTIPLE_CHOICE" } })));
  }
  const pretest = await prisma.assessment.create({ data: { courseId: course.id, title: "Pretest PROFAS Leadership", type: import_client.AssessmentType.PRETEST, passingScore: 0, timeLimitMin: 12 } });
  await prisma.assessmentQuestion.createMany({ data: [
    { assessmentId: pretest.id, prompt: "Ketika tim kehilangan arah, respons pertama Anda adalah\u2026", options: JSON.stringify(["Memperjelas tujuan bersama", "Mengambil alih semua tugas", "Menunggu situasi membaik", "Mencari siapa yang salah"]), correctAnswer: "0", order: 1, type: "MULTIPLE_CHOICE" },
    { assessmentId: pretest.id, prompt: "Umpan balik yang sehat sebaiknya\u2026", options: JSON.stringify(["Ditunda", "Spesifik dan berorientasi perbaikan", "Disampaikan di depan umum", "Hanya berisi pujian"]), correctAnswer: "1", order: 2, type: "MULTIPLE_CHOICE" },
    { assessmentId: pretest.id, prompt: "Indikator keputusan berkualitas adalah\u2026", options: JSON.stringify(["Tidak ada yang protes", "Cepat dibuat", "Selaras tujuan dan dapat dipertanggungjawabkan", "Disukai atasan"]), correctAnswer: "2", order: 3, type: "MULTIPLE_CHOICE" }
  ] });
  await prisma.enrollment.create({
    data: { userId: student.id, courseId: course.id, status: import_client.EnrollmentStatus.ACTIVE, progressPercent: 45 }
  });
  const lessons = await prisma.courseNode.findMany({ where: { courseId: course.id, type: { not: "FOLDER" } }, orderBy: [{ parent: { order: "asc" } }, { order: "asc" }] });
  const completedLessons = lessons.slice(0, 4);
  await prisma.nodeProgress.createMany({ data: completedLessons.map((node) => ({ userId: student.id, nodeId: node.id })) });
  await prisma.xPLog.createMany({ data: [
    { userId: student.id, points: 320, source: "SEED", sourceId: "nadia" },
    { userId: peers[0].id, points: 760, source: "SEED", sourceId: "arief" },
    { userId: peers[1].id, points: 645, source: "SEED", sourceId: "siti" },
    { userId: peers[2].id, points: 580, source: "SEED", sourceId: "dimas" },
    { userId: peers[3].id, points: 445, source: "SEED", sourceId: "maya" }
  ] });
  await prisma.forumCategory.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.forumReply.deleteMany();
  const catUmum = await prisma.forumCategory.create({ data: { name: "Diskusi Umum", description: "Tempat berbagi tentang kepemimpinan sehari-hari", order: 1 } });
  const catTanya = await prisma.forumCategory.create({ data: { name: "Tanya Mentor", description: "Tanya langsung dengan mentor PROFAS", order: 2 } });
  const thread1 = await prisma.forumThread.create({ data: { categoryId: catUmum.id, authorId: peers[0].id, title: "Cara terbaik menangani anggota tim yang demotivasi?", content: "Ada saran untuk menghadapi karyawan yang tiba-tiba turun kinerjanya?", pinned: true } });
  await prisma.forumReply.create({ data: { threadId: thread1.id, authorId: mentors[0].id, content: "Lakukan sesi 1-on-1 mendalam untuk mencari akar masalahnya." } });
  await prisma.calendarEvent.deleteMany();
  await prisma.calendarEvent.createMany({ data: [
    { title: "Live Q&A PROFAS Leadership", startTime: new Date((/* @__PURE__ */ new Date()).getTime() + 2 * 24 * 60 * 60 * 1e3), endTime: new Date((/* @__PURE__ */ new Date()).getTime() + 2 * 24 * 60 * 60 * 1e3 + 36e5), courseId: course.id },
    { title: "Batas Kumpul Evaluasi Modul 3", startTime: new Date((/* @__PURE__ */ new Date()).getTime() + 5 * 24 * 60 * 60 * 1e3), endTime: new Date((/* @__PURE__ */ new Date()).getTime() + 5 * 24 * 60 * 60 * 1e3 + 36e5), courseId: course.id }
  ] });
  await prisma.badge.deleteMany();
  await prisma.userBadge.deleteMany();
  const b1 = await prisma.badge.create({ data: { name: "First Steps", description: "Selesaikan 1 lesson pertama", imageUrl: "/badges/default.png", criteria: "LESSONS_COMPLETED:1" } });
  await prisma.forumThread.create({ data: { categoryId: catTanya.id, authorId: peers[0].id, title: "Tanya seputar Modul 2", content: "Halo Mentor!" } });
  const b2 = await prisma.badge.create({ data: { name: "Penanya Aktif", description: "Membuat 5 pertanyaan", imageUrl: "/badges/ask.png", criteria: "XP_EARNED:1000" } });
  await prisma.userBadge.create({ data: { userId: peers[0].id, badgeId: b2.id } });
  await prisma.userBadge.create({ data: { userId: student.id, badgeId: b1.id } });
}
main().then(() => console.log("Database PROFAS siap.")).catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
