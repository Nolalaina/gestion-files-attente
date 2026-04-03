export default function StatCard({ label, value, color = "var(--p)", icon }) {
  return (
    <div className="card stat-card card-lift fade-in">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
