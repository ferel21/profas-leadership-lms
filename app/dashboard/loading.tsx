import { DashboardChrome } from "@/components/DashboardChrome";

export default function DashboardLoading() {
  return (
    <DashboardChrome user={{ name: "Loading...", email: "", role: "STUDENT" }}>
      <div className="dash-title" style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: "2.5rem", width: "300px", marginBottom: "0.5rem", borderRadius: "8px" }}></div>
        <div className="skeleton" style={{ height: "1rem", width: "400px", borderRadius: "4px" }}></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="data-card" style={{ padding: "1.5rem" }}>
            <div className="skeleton" style={{ height: "1.5rem", width: "150px", marginBottom: "1rem", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ height: "3rem", width: "100%", borderRadius: "8px" }}></div>
          </div>
        ))}
      </div>
      
      <div className="data-card" style={{ padding: "2rem" }}>
        <div className="skeleton" style={{ height: "2rem", width: "200px", marginBottom: "2rem", borderRadius: "4px" }}></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "4rem", width: "100%", borderRadius: "8px" }}></div>
          ))}
        </div>
      </div>
    </DashboardChrome>
  );
}
