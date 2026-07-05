import { DashboardChrome } from "@/components/DashboardChrome";

export default function ForumLoading() {
  return (
    <DashboardChrome user={{ name: "Loading...", email: "", role: "STUDENT" }}>
      <div className="dash-title" style={{ marginBottom: "2rem" }}>
        <h1>Komunitas & Diskusi</h1>
        <p>Bertanya, berdiskusi, dan berbagi wawasan bersama rekan pemimpin lainnya.</p>
      </div>

      <div className="forum-layout" style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Sidebar Skeleton */}
        <aside className="forum-sidebar">
          <div className="skeleton" style={{ height: "3rem", width: "100%", marginBottom: "1rem", borderRadius: "8px" }}></div>
          <div className="data-card" style={{ padding: "1rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#64748b" }}>Kategori Diskusi</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: "2.5rem", width: "100%", borderRadius: "8px" }}></div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Skeleton */}
        <main className="forum-main">
          <div className="data-card" style={{ padding: "0" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="skeleton" style={{ height: "1.5rem", width: "200px", borderRadius: "4px" }}></div>
            </div>
            
            <div className="thread-list">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: "flex", padding: "1.5rem", borderBottom: "1px solid #f1f5f9", gap: "1rem" }}>
                  <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: "1.5rem", width: "70%", marginBottom: "0.5rem", borderRadius: "4px" }}></div>
                    <div className="skeleton" style={{ height: "1rem", width: "150px", marginBottom: "0.5rem", borderRadius: "4px" }}></div>
                    <div className="skeleton" style={{ height: "2.5rem", width: "100%", borderRadius: "4px" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </DashboardChrome>
  );
}
