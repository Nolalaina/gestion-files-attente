export default function StatCard({ label, value, color = "var(--p)", icon }) {
  return (
    <div className="card glass card-lift fade-in" style={{ 
      padding: "1.5rem", 
      borderRadius: "24px", 
      border: `1px solid ${color}44`,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ 
        position: "absolute", 
        top: "-20%", 
        right: "-10%", 
        width: "60px", 
        height: "60px", 
        background: color, 
        filter: "blur(40px)", 
        opacity: 0.2 
      }} />
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
        <div style={{ fontSize: "1.2rem", opacity: 0.8 }}>{icon}</div>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
      </div>
      
      <div className="font-title" style={{ fontSize: "2.4rem", fontWeight: 900, color }}>
        {value}
      </div>
    </div>
  );
}
