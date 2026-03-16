"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface ParticipantSearchProps {
  participants: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    payment_status: string | null;
    track_name: string | null;
    tier_name: string | null;
    track_icon: string | null;
    track_color: string | null;
    total_checkins: number;
    weight_change: number | null;
    last_checkin_date: string | null;
  }[];
}

export default function ParticipantSearch({
  participants,
}: ParticipantSearchProps) {
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

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
      if (paymentFilter !== "All") {
        const ps = (p.payment_status ?? "unpaid").toLowerCase();
        if (ps !== paymentFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [participants, search, trackFilter, statusFilter, paymentFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
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
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Dropped">Dropped</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="All">All Payments</option>
            <option value="paid">Paid</option>
            <option value="invoiced">Invoiced</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            Showing {filtered.length} of {participants.length} participants
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Track</th>
              <th className="px-6 py-3">Tier</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Payment</th>
              <th className="px-6 py-3">Weight Change</th>
              <th className="px-6 py-3">Check-ins</th>
              <th className="px-6 py-3">Last Check-in</th>
            </tr>
          </thead>
          <tbody>
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
              filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`hover:bg-red-50 transition-colors cursor-pointer ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/participants/${p.id}`}
                      className="text-gray-900 font-medium hover:text-red-600"
                    >
                      {p.name}
                    </Link>
                  </td>
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
                            : p.status === "inactive"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (p.payment_status ?? "unpaid") === "paid"
                          ? "bg-green-100 text-green-700"
                          : (p.payment_status ?? "unpaid") === "invoiced"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.payment_status ?? "unpaid"}
                    </span>
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
                  <td className="px-6 py-3 text-gray-600">
                    {p.total_checkins}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {p.last_checkin_date ?? (
                      <span className="text-gray-400">Never</span>
                    )}
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
