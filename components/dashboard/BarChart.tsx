"use client";

import { useState } from "react";

export default function BarChart({ data, isDark }: { data: any[]; isDark: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  if (data.length === 0) return null;

  const values = data.map((d) => parseFloat(d.profit_percent));
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = Math.max(maxVal - minVal, 1);

  const chartHeight = 140;
  const barWidth = 24;
  const gap = 8;
  const totalWidth = data.length * (barWidth + gap) - gap;
  const paddingTop = 8;
  const paddingBottom = 8;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const zeroY = paddingTop + (maxVal / range) * usableHeight;

  const positiveColor = isDark ? "#00f5ff" : "#15803d";
  const negativeColor = "#ff2d78";
  const zeroLineColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg
        width={Math.max(totalWidth, 200)}
        height={chartHeight + 24}
        style={{ overflow: "visible", display: "block", margin: "0 auto" }}
      >
        <line x1={0} y1={zeroY} x2={Math.max(totalWidth, 200)} y2={zeroY} stroke={zeroLineColor} strokeWidth={1} />
        {data.map((session, i) => {
          const val = parseFloat(session.profit_percent);
          const isPos = val >= 0;
          const barH = Math.max((Math.abs(val) / range) * usableHeight, 2);
          const x = i * (barWidth + gap);
          const barY = isPos ? zeroY - barH : zeroY;
          const color = isPos ? positiveColor : negativeColor;
          return (
            <g key={session.id}>
              <rect
                x={x} y={barY} width={barWidth} height={barH} rx={4}
                fill={color}
                opacity={tooltip && tooltip.date === session.ended_at ? 1 : 0.75}
                style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
                onMouseEnter={(e) => {
                  const svgEl = (e.target as SVGRectElement).closest("svg");
                  const svgRect = svgEl?.getBoundingClientRect();
                  if (!svgRect) return;
                  setTooltip({ x: svgRect.left + x + barWidth / 2, y: svgRect.top + barY, value: val, date: session.ended_at });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {isDark && (
                <rect x={x} y={barY} width={barWidth} height={barH} rx={4} fill={color} opacity={0.12}
                  style={{ pointerEvents: "none", filter: "blur(4px)" }} />
              )}
              <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle"
                style={{ fontFamily: "DM Mono, monospace", fontSize: "8px", fill: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>
                {formatDate(session.ended_at)}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x, top: tooltip.y - 36, transform: "translateX(-50%)", zIndex: 200,
          padding: "6px 12px", borderRadius: "999px",
          backgroundColor: isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          backdropFilter: "blur(8px)", fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
          color: tooltip.value >= 0 ? (isDark ? "#00f5ff" : "#15803d") : "#ff2d78",
          whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          {tooltip.value >= 0 ? `+${tooltip.value}%` : `${tooltip.value}%`}
        </div>
      )}
    </div>
  );
}