import { DashboardChrome } from "@/components/DashboardChrome";

export default function DashboardLoading() {
  return (
    <DashboardChrome user={{ name: "Loading...", email: "", role: "STUDENT" }}>
      <div className="dashboard-loading-state" aria-live="polite" aria-busy="true">
        <div className="dashboard-loading-hero">
          <div>
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-75" />
          </div>
          <div className="spinner-modern" />
        </div>
        <div className="skeleton-grid">
          <div className="skeleton-card">
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-100" />
          </div>
          <div className="skeleton-card">
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-100" />
          </div>
          <div className="skeleton-card">
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-100" />
          </div>
        </div>
        <div className="dashboard-loading-panel">
          <div className="skeleton-block skeleton-h-160 skeleton-w-100" />
          <div className="skeleton-block skeleton-h-160 skeleton-w-100" />
        </div>
      </div>
    </DashboardChrome>
  );
}
