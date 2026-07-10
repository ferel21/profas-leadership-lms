export default function DashboardLoading() {
  return (
    <div className="dashboard-loading-shell" aria-live="polite" aria-busy="true">
      <aside className="dashboard-loading-sidebar">
        <div className="dashboard-loading-logo" />
        <div className="dashboard-loading-nav" />
        <div className="dashboard-loading-nav" />
        <div className="dashboard-loading-nav" />
        <div className="dashboard-loading-nav" />
      </aside>
      <main className="dashboard-loading-main">
        <div className="dashboard-loading-header"><div /><span /></div>
        <div className="dashboard-loading-hero">
          <div><div className="skeleton-block skeleton-h-20 skeleton-w-50" /><div className="skeleton-block skeleton-h-40 skeleton-w-75" /></div>
        </div>
        <div className="skeleton-grid">
          {Array.from({ length: 4 }).map((_, index) => <div className="skeleton-card" key={index}><div className="skeleton-block skeleton-h-20 skeleton-w-50" /><div className="skeleton-block skeleton-h-40 skeleton-w-100" /></div>)}
        </div>
        <div className="dashboard-loading-panel"><div className="skeleton-block skeleton-h-160 skeleton-w-100" /><div className="skeleton-block skeleton-h-160 skeleton-w-100" /></div>
      </main>
    </div>
  );
}
