const fs = require('fs');
let sertifikat = fs.readFileSync('app/sertifikat/[number]/page.tsx', 'utf8');
sertifikat = sertifikat.replace(/cert\.course!/g, 'cert.course?.');
sertifikat = sertifikat.replace(/cert\.user!/g, 'cert.user?.');
sertifikat = sertifikat.replace(/\?\.\._count/g, '?._count');
fs.writeFileSync('app/sertifikat/[number]/page.tsx', sertifikat);
