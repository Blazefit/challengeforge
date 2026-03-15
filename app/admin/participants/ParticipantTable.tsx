"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface EnrichedParticipant {
  id: string;
  name: string;
  email: string;
  status: string;
  track_name: string | null;
  track_icon: string | null;
  track_color: string | null;
  tier_name: string | null;
  last_checkin_date: string | null;
  latest_weight: number | null;
  first_weight: number | null;
  weight_change: number | null;
  consistency_pct: number;
}

export default function ParticipantTable({
  participants,
}: {
  participants: EnrichedParticipant[];
}) {
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const tracks = useMemo(() => {
    const names = new Set<string>();
    participants.forEach((p) => {
      if (p.track_name) names.add(p.track_name);
    });
    return Array.from(names).sort();
  }, [participants]);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const q = search.toLowerCase();
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (trackFilter !== "All" && p.track_name !== trackFilter) {
        return false;
      }
      if (statusFilter !== "All" && p.status !== statusFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [participants, search, trackFilter, statusFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="All">All Tracks</option>
          {tracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Dropped">Dropped</option>
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length} participant{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Track</th>
              <th className="px-6 py-3">Tier</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Check-in</th>
              <th className="px-6 py-3">Weight Change</th>
              <th className="px-6 py-3">Consistency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No participants match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/participants/${p.id}`}
                      className="text-gray-900 font-medium hover:text-red-600"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{p.email}</td>
                  <td className="px-6 py-3">
                    {p.track_name ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: p.track_color
                            ? `${p.track_color}20`
                            : "#f3f4f6",
                          color: p.track_color ?? "#6b7280",
                        }}
                      >
                        {p.track_icon && (
                          <span className="mr-0.5">{p.track_icon}</span>
                        )}
                        {p.track_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {p.tier_name ?? <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : p.status === "dropped"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {p.last_checkin_date ?? (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {p.weight_change != null ? (
                      <span
                        className={
                          p.weight_change < 0
                            ? "text-green-600 font-medium"
                            : p.weight_change > 0
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }
                      >
                        {p.weight_change > 0 ? "+" : ""}
                        {p.weight_change} lbs
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.consistency_pct >= 80
                              ? "bg-green-500"
                              : p.consistency_pct >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${p.consistency_pct}%` }}
                        />
                      </div>
                      <span className="text-gray-600 text-xs">
                        {p.consistency_pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
