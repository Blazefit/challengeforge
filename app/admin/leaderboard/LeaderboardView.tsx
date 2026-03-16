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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTrack === track
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {track}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
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
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => {
                const pct = p.weight_change_pct;
                const sign = pct > 0 ? "+" : "";
                const weightColor =
                  pct > 0
                    ? "text-red-600"
                    : pct < 0
                    ? "text-green-600"
                    : "text-gray-500";

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          p.rank === 1
                            ? "bg-yellow-100 text-yellow-700"
                            : p.rank === 2
                            ? "bg-gray-200 text-gray-700"
                            : p.rank === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
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
                    <td className={`px-6 py-3 text-right font-mono ${weightColor}`}>
                      {sign}
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-gray-700">
                      {p.consistency_pct.toFixed(0)}%
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold text-gray-900">
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
                    className="px-6 py-12 text-center text-gray-400"
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
