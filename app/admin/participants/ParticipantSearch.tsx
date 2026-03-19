"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Participant {
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
}

interface ParticipantSearchProps {
  participants: Participant[];
}

export default function ParticipantSearch({
  participants,
}: ParticipantSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  async function handleBulkAction(newStatus: string) {
    if (selected.size === 0) return;

    const statusLabel = newStatus === "dropped" ? "deactivate" : newStatus === "active" ? "reactivate" : newStatus;
    if (!confirm(`${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} ${selected.size} participant${selected.size !== 1 ? "s" : ""}?`)) return;

    setActionLoading(true);
    setActionResult(null);
    let succeeded = 0;
    let failed = 0;

    for (const id of selected) {
      try {
        const res = await fetch(`/api/participants/${id}/edit`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setActionLoading(false);
    setSelected(new Set());

    if (failed === 0) {
      setActionResult({ type: "success", message: `${succeeded} participant${succeeded !== 1 ? "s" : ""} updated to "${newStatus}"` });
    } else {
      setActionResult({ type: "error", message: `${succeeded} updated, ${failed} failed` });
    }

    setTimeout(() => setActionResult(null), 4000);
    router.refresh();
  }

  return (
    <div style={{ background: "var(--surface-container-high)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      {/* Search and Filters */}
      <div className="px-6 py-5 space-y-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ma-input"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className="ma-input" style={{ width: "auto" }}>
            <option value="All">All Tracks</option>
            {tracks.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ma-input" style={{ width: "auto" }}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Dropped">Dropped</option>
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="ma-input" style={{ width: "auto" }}>
            <option value="All">All Payments</option>
            <option value="paid">Paid</option>
            <option value="invoiced">Invoiced</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <span className="text-xs ml-auto" style={{ color: "var(--on-surface-muted)" }}>
            {filtered.length} of {participants.length}
          </span>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="px-6 py-3 flex items-center gap-3 flex-wrap" style={{ background: "rgba(147, 0, 10, 0.15)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--tertiary)" }}>
            {selected.size} selected
          </span>
          <button onClick={() => handleBulkAction("dropped")} disabled={actionLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors disabled:opacity-50"
            style={{ background: "var(--tertiary-container)", color: "var(--tertiary)" }}>
            {actionLoading ? "Processing..." : "Deactivate"}
          </button>
          <button onClick={() => handleBulkAction("active")} disabled={actionLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors disabled:opacity-50"
            style={{ background: "var(--success-container)", color: "var(--success)" }}>
            Reactivate
          </button>
          <button onClick={() => setSelected(new Set())} className="ma-btn-secondary text-xs py-1 px-3">Clear</button>
          {actionResult && (
            <span className={`text-xs font-medium ml-auto`} style={{ color: actionResult.type === "success" ? "var(--success)" : "var(--tertiary)" }}>
              {actionResult.message}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
              <th className="px-4 py-3 w-10 text-left">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-purple-500" />
              </th>
              {["Name", "Track", "Tier", "Status", "Payment", "Weight", "Check-ins", "Last"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--on-surface-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm" style={{ color: "var(--on-surface-muted)" }}>
                  No participants match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="transition-colors cursor-pointer"
                  style={{
                    background: selected.has(p.id) ? "rgba(128, 131, 255, 0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid rgba(70, 69, 84, 0.08)",
                  }}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded accent-purple-500" />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/participants/${p.id}`} className="font-medium text-sm hover:underline" style={{ color: "var(--on-surface)" }}>
                      {p.name}
                    </Link>
                    <p className="text-xs" style={{ color: "var(--on-surface-muted)" }}>{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {p.track_name ? (
                      <span className="ma-chip" style={{ backgroundColor: p.track_color ? `${p.track_color}20` : "var(--surface-bright)", color: p.track_color ?? "var(--on-surface-variant)" }}>
                        {p.track_icon && <span>{p.track_icon}</span>}
                        {p.track_name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--outline)" }}>--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    {p.tier_name ?? <span style={{ color: "var(--outline)" }}>--</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="ma-badge" style={{
                      background: p.status === "active" ? "rgba(125, 220, 142, 0.15)" : p.status === "dropped" ? "rgba(147, 0, 10, 0.2)" : "rgba(255, 212, 102, 0.15)",
                      color: p.status === "active" ? "var(--success)" : p.status === "dropped" ? "var(--tertiary)" : "var(--warning)",
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="ma-badge" style={{
                      background: (p.payment_status ?? "unpaid") === "paid" ? "rgba(125, 220, 142, 0.15)" : (p.payment_status ?? "unpaid") === "invoiced" ? "rgba(255, 212, 102, 0.15)" : "rgba(147, 0, 10, 0.2)",
                      color: (p.payment_status ?? "unpaid") === "paid" ? "var(--success)" : (p.payment_status ?? "unpaid") === "invoiced" ? "var(--warning)" : "var(--tertiary)",
                    }}>
                      {p.payment_status ?? "unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{
                    color: p.weight_change != null ? (p.weight_change < 0 ? "var(--success)" : p.weight_change > 0 ? "var(--tertiary)" : "var(--on-surface-muted)") : "var(--outline)",
                  }}>
                    {p.weight_change != null ? `${p.weight_change > 0 ? "+" : ""}${p.weight_change}` : "--"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    {p.total_checkins}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--on-surface-muted)" }}>
                    {p.last_checkin_date ?? "Never"}
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
