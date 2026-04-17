"use client";

function darken(hex: string): string {
  const map: Record<string, string> = {
    "#00f5ff": "#004f54", "#ff2d78": "#8a0030", "#ffd700": "#6b5200",
    "#a855f7": "#5b1a9e", "#ff6b35": "#8a2d00",
  };
  return map[hex] ?? hex;
}

export default function ActionButton({ label, color, onClick, theme, highlighted }: {
  label: string; color: string; onClick: () => void; theme: string; highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-appear hover:scale-105 active:scale-95"
      style={{
        padding: "10px 24px", borderRadius: "999px",
        backgroundColor: highlighted ? `${color}35` : theme === "light" ? `${color}25` : "transparent",
        border: `1.5px solid ${highlighted ? color : theme === "light" ? darken(color) : color}`,
        color: theme === "light" ? darken(color) : color,
        fontSize: "12px", fontWeight: 700, fontFamily: "DM Mono, monospace",
        letterSpacing: "0.1em", textTransform: "uppercase" as const,
        boxShadow: highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark" ? `0 0 12px ${color}40, inset 0 0 12px ${color}10` : `0 2px 8px ${color}50`,
        textShadow: highlighted ? `0 0 12px ${color}` : theme === "dark" ? `0 0 8px ${color}80` : "none",
        cursor: "pointer", transition: "all 0.2s ease",
        transform: highlighted ? "scale(1.08)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme === "light" ? `${color}40` : `${color}20`;
        e.currentTarget.style.boxShadow = theme === "dark"
          ? `0 0 24px ${color}70, inset 0 0 20px ${color}20`
          : `0 4px 16px ${color}70`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = highlighted ? `${color}35` : theme === "light" ? `${color}25` : "transparent";
        e.currentTarget.style.boxShadow = highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark" ? `0 0 12px ${color}40, inset 0 0 12px ${color}10` : `0 2px 8px ${color}50`;
      }}
    >
      {label}
    </button>
  );
}