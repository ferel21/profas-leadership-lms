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
        <div className="dashboard-loading-content">
          <div className="dashboard-loading-resume">
            <div className="dashboard-loading-resume-copy">
              <div /><div /><div /><div /><div />
            </div>
            <div className="dashboard-loading-resume-visual" />
          </div>
          <div className="dashboard-loading-panel">
            <div />
            <div />
          </div>
        </div>
      </main>
    </div>
  );
}
