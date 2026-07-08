import { DashboardChrome } from "@/components/DashboardChrome";

export default function PeringkatLoading() {
  return (
    <DashboardChrome user={{ name: "Loading...", email: "", role: "STUDENT" }}>
      <div className="loader-container">
        <div className="spinner-modern" />
        <div className="skeleton-grid mt-4">
          <div className="skeleton-card">
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-100" />
          </div>
          <div className="skeleton-card">
            <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
            <div className="skeleton-block skeleton-h-40 skeleton-w-100" />
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
