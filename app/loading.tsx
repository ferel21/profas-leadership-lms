export default function GlobalLoading() {
  return (
    <div className="loader-container">
      <div className="spinner-modern" />
      <div className="skeleton-block skeleton-h-20 skeleton-w-50" />
      <div className="skeleton-block skeleton-h-20 skeleton-w-75" />
      <p className="text-muted text-sm mt-2">Memuat halaman eksekutif PROFAS...</p>
    </div>
  );
}
