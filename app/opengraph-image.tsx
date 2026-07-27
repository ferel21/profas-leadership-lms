import { ImageResponse } from "next/og";

export const alt = "PROFAS — Kepastian hukum untuk keputusan bisnis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#FAFCFD",
        color: "#14243A",
        fontFamily: "Arial, sans-serif",
        padding: "64px 72px",
      }}
    >
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 260, border: "2px solid #D7E2E7", right: -120, top: -170 }} />
      <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 180, border: "2px solid #D7E2E7", right: -40, top: -90 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14, background: "#14243A", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>P</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>PROFAS</div>
            <div style={{ fontSize: 14, color: "#506174", letterSpacing: 3 }}>LEGAL ADVISORY</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 930 }}>
          <div style={{ color: "#17786F", fontSize: 17, fontWeight: 700, letterSpacing: 3, marginBottom: 22 }}>CONTEXT FIRST · DECISION READY</div>
          <div style={{ fontSize: 68, lineHeight: 1.03, letterSpacing: -3, fontWeight: 600 }}>Kepastian hukum untuk keputusan yang berani.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#506174", fontSize: 18 }}>
          <div style={{ width: 110, height: 4, background: "#F29E6D" }} /> Legalitas · Kontrak · Ketenagakerjaan · Tata kelola · Risiko
        </div>
      </div>
    </div>,
    size,
  );
}
