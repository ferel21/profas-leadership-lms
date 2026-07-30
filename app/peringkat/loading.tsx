export default function PeringkatLoading() {
  return (
    <main className="loader-container min-h-screen bg-slate-50 p-6" aria-busy="true" aria-label="Memuat papan peringkat">
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
    </main>
  );
}
