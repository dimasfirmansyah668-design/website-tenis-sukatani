export default function LoadingSpinner({ text = 'Memuat...', fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>
      </div>
    );
  }
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );
}
