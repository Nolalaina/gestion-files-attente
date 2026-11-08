import Icon from "./Icon";

const TONES = {
  accent: "stat-card-accent",
  success: "stat-card-success",
  warning: "stat-card-warning",
  danger: "stat-card-danger",
  info: "stat-card-info",
};

export default function StatCard({ label, value, icon, tone = "accent" }) {
  return (
    <div className={`stat-card ${TONES[tone] || TONES.accent}`}>
      <div className="stat-card-head">
        {icon ? <Icon name={icon} size={18} /> : null}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
