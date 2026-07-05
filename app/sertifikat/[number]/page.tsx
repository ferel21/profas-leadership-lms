import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle2, ExternalLink, QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { CertificateActions } from "@/components/CertificateActions";

export default async function CertificatePage({ params }: { params?: Promise<{ number: string }> }) {
	const resolvedParams = await params;
	const number = resolvedParams?.number;
	if (!number) notFound();

	const cert = await prisma.certificate.findUnique({
		where: { uniqueNumber: number },
		include: { user: true, course: { include: { mentor: true, _count: { select: { nodes: true } } } } },
	});

	if (!cert) notFound();

	return (
		<main className="certificate-page">
			<header>
				<Logo />
				<Link href="/dashboard">Kembali ke dashboard</Link>
			</header>

			<div className="certificate-status">
				<CheckCircle2 />
				<span>
					<b>Sertifikat Terverifikasi</b>
					<small>Diterbitkan oleh PROFAS Leadership</small>
				</span>
			</div>

			<section className="certificate-paper">
				<div className="cert-corners" />
				<div className="cert-brand">
					<Logo />
					<span>
						<Award />
					</span>
				</div>

				<p className="cert-label">SERTIFIKAT PENYELESAIAN</p>
				<h1>Diberikan kepada</h1>
				<h2>{cert.user?.name}</h2>
				<p>
					telah berhasil menyelesaikan seluruh rangkaian pembelajaran ({cert.course?.durationHours} Jam Pembelajaran • {cert.course?._count.nodes} Materi) dan evaluasi kompetensi pada program resmi:
				</p>
				<h3>{cert.course?.title}</h3>

				<div className="cert-details">
					<span>
						<small>TANGGAL TERBIT</small>
						<b>
							{new Intl.DateTimeFormat("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
							}).format(cert.issuedAt)}
						</b>
					</span>

					<span className="qr-placeholder">
						<QrCode />
					</span>

					<span>
						<small>NOMOR SERTIFIKAT</small>
						<b>{cert.uniqueNumber}</b>
					</span>
				</div>

				<div className="cert-signature">
					<span>
						<i>Ratna Maharani</i>
						<b>{cert.course?.mentor.name}</b>
						<small>Lead Facilitator PROFAS</small>
					</span>

					<span>
						<i>PROFAS</i>
						<b>PROFAS Institute</b>
						<small>Learning & Development</small>
					</span>
				</div>
			</section>

			<CertificateActions title={cert.course?.title} uniqueNumber={cert.uniqueNumber} />

			<a
				className="cert-verify-link"
				href={`/api/certificates/verify?number=${cert.uniqueNumber}`}
				target="_blank"
				rel="noreferrer"
			>
				<ExternalLink /> Verifikasi data sertifikat
			</a>
		</main>
	);
}
