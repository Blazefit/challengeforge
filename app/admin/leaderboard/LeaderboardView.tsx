"use client";

import { useState } from "react";
import type { ScoredParticipant } from "@/lib/scoring";

interface LeaderboardViewProps {
  data: ScoredParticipant[];
}

export default function LeaderboardView({ data }: LeaderboardViewProps) {
  // Extract unique track names for filter tabs
  const trackNames = Array.from(new Set(data.map((d) => d.track_name))).sort();
  const [activeTrack, setActiveTrack] = useState<string>("All");

  // Filter and re-rank within track
  const filtered =
    activeTrack === "All"
      ? data
      : (() => {
          const trackData = data
            .filter((d) => d.track_name === activeTrack)
            .sort((a, b) => b.score - a.score);
          return trackData.map((d, i) => ({ ...d, rank: i + 1 }));
        })();

  return (
    <div>
      {/* Track Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["All", ...trackNames].map((track) => (
          <button
            key={track}
            onClick={() => setActiveTrack(track)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={activeTrack === track
              ? { background: "var(--primary)", color: "var(--on-primary)" }
              : { background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }
            }
          >
            {track}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-container-high)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)", color: "var(--on-surface-muted)" }}>
                <th className="px-6 py-3 font-medium w-16">Rank</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Track</th>
                <th className="px-6 py-3 font-medium text-right">
                  Weight Change
                </th>
                <th className="px-6 py-3 font-medium text-right">
                  Consistency
                </th>
                <th className="px-6 py-3 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(70, 69, 84, 0.08)" }}>
              {filtered.map((p) => {
                const pct = p.weight_change_pct;
                const sign = pct > 0 ? "+" : "";
                const weightColorStyle: React.CSSProperties =
                  pct > 0
                    ? { color: "var(--tertiary)" }
                    : pct < 0
                    ? { color: "var(--success)" }
                    : { color: "var(--on-surface-muted)" };

                return (
                  <tr key={p.id} className="transition-colors">
                    <td className="px-6 py-3">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                        style={p.rank === 1
                          ? { background: "rgba(255, 193, 7, 0.15)", color: "var(--warning)" }
                          : p.rank === 2
                          ? { background: "rgba(70, 69, 84, 0.2)", color: "var(--on-surface-variant)" }
                          : p.rank === 3
                          ? { background: "rgba(251, 146, 60, 0.15)", color: "#fb923c" }
                          : { background: "var(--surface-container-low)", color: "var(--on-surface-muted)" }
                        }
                      >
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium" style={{ color: "var(--on-surface)" }}>
                      {p.name}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: p.track_color }}
                      >
                        {p.track_icon} {p.track_name}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono" style={weightColorStyle}>
                      {sign}
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 text-right font-mono" style={{ color: "var(--on-surface-variant)" }}>
                      {p.consistency_pct.toFixed(0)}%
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold" style={{ color: "var(--on-surface)" }}>
                        {p.score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center" style={{ color: "var(--on-surface-muted)" }}
                  >
                    No participants in this track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
