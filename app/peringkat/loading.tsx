import { DashboardChrome } from "@/components/DashboardChrome";

export default function LeaderboardLoading() {
  return (
    <DashboardChrome user={{ name: "Loading...", email: "", role: "STUDENT" }}>
      <div className="leaderboard-heading">
        <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%" }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: "1rem", width: "150px", marginBottom: "0.5rem", borderRadius: "4px" }}></div>
          <div className="skeleton" style={{ height: "2rem", width: "300px", marginBottom: "0.5rem", borderRadius: "8px" }}></div>
          <div className="skeleton" style={{ height: "1rem", width: "250px", borderRadius: "4px" }}></div>
        </div>
      </div>
      
      <section className="leaderboard-list">
        <div className="leaderboard-row leaderboard-head">
          <span className="skeleton" style={{flex: "0 0 60px", height: "1rem", borderRadius: "4px"}}></span>
          <span className="skeleton" style={{flex: 1, height: "1rem", borderRadius: "4px"}}></span>
          <span className="skeleton" style={{flex: 1, height: "1rem", borderRadius: "4px"}}></span>
          <span className="skeleton" style={{flex: 1, height: "1rem", borderRadius: "4px"}}></span>
          <span className="skeleton" style={{flex: "0 0 100px", height: "1rem", borderRadius: "4px"}}></span>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="leaderboard-row" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}>
            <div className="skeleton" style={{ flex: "0 0 60px", height: "2rem", borderRadius: "4px" }}></div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
              <div className="skeleton" style={{ height: "1.5rem", width: "150px", borderRadius: "4px" }}></div>
            </div>
            <div className="skeleton" style={{ flex: 1, height: "1.5rem", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ flex: 1, height: "1.5rem", borderRadius: "12px" }}></div>
            <div className="skeleton" style={{ flex: "0 0 100px", height: "1.5rem", borderRadius: "4px" }}></div>
          </div>
        ))}
      </section>
    </DashboardChrome>
  );
}
