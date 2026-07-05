const fs = require('fs');

// Fix dashboard
let dashboard = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
dashboard = dashboard.replace(/prisma\.material\.findMany.*?\),/g, 'prisma.courseNode.findMany({where:{course:{mentorId:user.id},type:{not:"FOLDER"}},orderBy:{order:"desc"}}),');
dashboard = dashboard.replace(/const shapedMaterials = materials.*/g, 'const shapedMaterials = materials.map(m => ({ ...m, createdAt: new Date().toISOString(), uploader: { name: user.name }, lesson: { title: m.title, module: { title: "Module", course: { title: "Course", slug: "slug" } } } }));');
dashboard = dashboard.replace(/materials\.length/g, 'materials.length');
dashboard = dashboard.replace(/course\.modules\.length/g, 'course.nodes.length');
dashboard = dashboard.replace(/prisma\.lesson\.count/g, 'prisma.courseNode.count');
fs.writeFileSync('app/dashboard/page.tsx', dashboard);

// Fix mentor page
let mentor = fs.readFileSync('app/mentor/page.tsx', 'utf8');
mentor = mentor.replace(/include:\{modules:\{orderBy:\{order:"asc"\},include:\{lessons:\{orderBy:\{order:"asc"\},select:\{id:true,title:true\}\}\}\}/g, 'include:{nodes:{orderBy:{order:"asc"},select:{id:true,title:true,type:true}}');
mentor = mentor.replace(/course\.modules\.flatMap.*?\}\)\)/g, 'course.nodes.map(node => ({ id: node.id, title: node.title, moduleTitle: course.title }))');
mentor = mentor.replace(/course\.modules\.length/g, 'course.nodes.length');
fs.writeFileSync('app/mentor/page.tsx', mentor);

// Fix program page
let program = fs.readFileSync('app/program/[slug]/page.tsx', 'utf8');
program = program.replace(/include: \{ modules: \{ orderBy: \{ order: "asc" \}, include: \{ lessons: \{ orderBy: \{ order: "asc" \} \} \} \} \}/g, 'include: { nodes: { orderBy: [{ parentId: "asc" }, { order: "asc" }] } }');
program = program.replace(/course\.modules\.flatMap.*?\}\)\)/g, 'course.nodes || []');
program = program.replace(/course\.modules\.length/g, 'course.nodes?.length || 0');
program = program.replace(/module\.lessons\.length/g, '1');
program = program.replace(/\{course\.modules\.map.*?<\/div>/s, '{course.nodes?.filter(n => n.type === "FOLDER").map((folder, i) => <div key={folder.id} className="module-card"><h3>{i + 1}. {folder.title}</h3><p>{folder.description}</p></div>)}</div>');
fs.writeFileSync('app/program/[slug]/page.tsx', program);

// Fix riwayat page
let riwayat = fs.readFileSync('app/riwayat/page.tsx', 'utf8');
riwayat = riwayat.replace(/lessonProgress/g, 'nodeProgress');
riwayat = riwayat.replace(/lessons\.forEach\(l =>/g, 'lessons.forEach((l: any) =>');
riwayat = riwayat.replace(/attempts\.forEach\(a =>/g, 'attempts.forEach((a: any) =>');
riwayat = riwayat.replace(/xpLogs\.forEach\(x =>/g, 'xpLogs.forEach((x: any) =>');
fs.writeFileSync('app/riwayat/page.tsx', riwayat);

// Fix sertifikat page
let sertifikat = fs.readFileSync('app/sertifikat/[number]/page.tsx', 'utf8');
sertifikat = sertifikat.replace(/_count: \{ select: \{ modules: true \} \}/g, '_count: { select: { nodes: true } }');
sertifikat = sertifikat.replace(/cert\.course\./g, 'cert.course!');
sertifikat = sertifikat.replace(/cert\.user\./g, 'cert.user!');
sertifikat = sertifikat.replace(/cert\.course!\_count\.modules/g, 'cert.course!._count.nodes');
fs.writeFileSync('app/sertifikat/[number]/page.tsx', sertifikat);

console.log("Fixes applied");
