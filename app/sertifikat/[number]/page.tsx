import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { prisma } from "@/services/prisma";
import { Logo } from "@/components/ui/Logo";
import { CertificateActions } from "@/components/shared/CertificateActions";

export default async function CertificatePage({ params }: { params?: Promise<{ number: string }> }) {
	const resolvedParams = await params;
	const rawNumber = resolvedParams?.number;
	const number = rawNumber ? decodeURIComponent(rawNumber) : null;
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
				<CheckCircle2 aria-hidden="true" />
				<span>
					<b>Sertifikat Terverifikasi</b>
					<small>Nomor penerbitan tercatat di PROFAS Leadership</small>
				</span>
			</div>

			<section className="certificate-paper" aria-labelledby="certificate-title">
				<div className="cert-corners" />
				<div className="cert-brand">
					<Logo />
					<span>
						<Award aria-hidden="true" />
					</span>
				</div>

				<p className="cert-label">PROFAS LEADERSHIP · KREDENSIAL RESMI</p>
				<h1 id="certificate-title">Sertifikat Penyelesaian</h1>
				<p className="cert-recipient-label">Diberikan kepada</p>
				<h2>{cert.user?.name || "Peserta PROFAS Leadership"}</h2>
				<p>
					telah berhasil menyelesaikan seluruh rangkaian pembelajaran ({cert.course?.durationHours || 14} Jam Pembelajaran • {cert.course?._count?.nodes || 12} Materi) dan evaluasi kompetensi pada program resmi:
				</p>
				<h3>{cert.course?.title || "Strategic Leadership Masterclass"}</h3>

				<div className="cert-details">
					<span>
						<small>TANGGAL TERBIT</small>
						<b>
							{new Intl.DateTimeFormat("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
							}).format(cert.issuedAt ? new Date(cert.issuedAt) : new Date())}
						</b>
					</span>

					<span className="cert-verification-seal" aria-label="Kredensial terverifikasi">
						<ShieldCheck aria-hidden="true" />
						<small>VERIFIED</small>
					</span>

					<span>
						<small>NOMOR SERTIFIKAT</small>
						<b>{cert.uniqueNumber || number}</b>
					</span>
				</div>

				<div className="cert-signature">
					<span>
						<i>{cert.course?.mentor?.name || "Dr. Ratna Maharani"}</i>
						<b>{cert.course?.mentor?.name || "Dr. Ratna Maharani"}</b>
						<small>Lead Facilitator PROFAS</small>
					</span>

					<span>
						<i>PROFAS</i>
						<b>PROFAS Institute</b>
						<small>Learning & Development</small>
					</span>
				</div>
			</section>

			<CertificateActions
				title={cert.course?.title || "Strategic Leadership Masterclass"}
				uniqueNumber={cert.uniqueNumber || number}
				recipientName={cert.user?.name || "Peserta PROFAS Leadership"}
				issuedAt={cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("id-ID") : new Date().toLocaleDateString("id-ID")}
				mentorName={cert.course?.mentor?.name || "Dr. Ratna Maharani"}
			/>

			<a
				className="cert-verify-link"
				href={`/api/certificates/verify?number=${cert.uniqueNumber || number}`}
				target="_blank"
				rel="noreferrer"
			>
				<ExternalLink aria-hidden="true" /> Lihat rekam verifikasi
			</a>
		</main>
	);
}
