---
name: database-supabase-prisma
description: Digunakan untuk mendesain, memperbaiki, dan menghubungkan database LMS menggunakan Supabase, Prisma, PostgreSQL, atau ORM lain.
---

## Tujuan

AI memastikan struktur database mendukung LMS sungguhan.

## Model Data Minimal

Database LMS sebaiknya memiliki entitas:

1. User

   * id
   * name
   * email
   * role
   * image/avatar
   * createdAt
   * updatedAt

2. Course

   * id
   * title
   * description
   * thumbnail
   * status
   * createdBy
   * createdAt
   * updatedAt

3. Material

   * id
   * courseId
   * title
   * description
   * type
   * content
   * fileUrl
   * order
   * status
   * createdBy
   * createdAt
   * updatedAt

4. Enrollment

   * id
   * userId
   * courseId
   * status
   * enrolledAt

5. Progress

   * id
   * userId
   * courseId
   * materialId
   * completed
   * completedAt

6. Certificate

   * id
   * userId
   * courseId
   * certificateNumber
   * issuedAt
   * fileUrl

## Relasi

* User mentor bisa membuat banyak Course.
* Course punya banyak Material.
* User peserta bisa punya banyak Enrollment.
* User peserta punya banyak Progress.
* Course bisa menghasilkan Certificate jika selesai.
* Certificate hanya valid jika progress 100%.

## Query Penting

AI harus mampu membuat query untuk:

* Ambil semua course.
* Ambil course by id.
* Ambil materi berdasarkan course.
* Ambil progress peserta.
* Tandai materi selesai.
* Hitung persentase progress.
* Cek apakah semua materi selesai.
* Generate sertifikat.

## Validasi Database

* Jangan membuat progress duplikat untuk user, course, material yang sama.
* Jangan membuat sertifikat ganda untuk user dan course yang sama.
* Gunakan unique constraint bila memungkinkan.
* Gunakan foreign key.
* Gunakan cascade dengan hati-hati.
