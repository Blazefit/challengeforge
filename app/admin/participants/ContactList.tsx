"use client";

import { useState } from "react";

interface ContactListProps {
  participants: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    track_name: string | null;
    track_color: string | null;
    status: string;
    payment_status: string | null;
    last_checkin_date: string | null;
  }[];
}

type FilterType = "all" | "missing_today" | "unpaid" | "at_risk";

export default function ContactList({ participants }: ContactListProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [copied, setCopied] = useState(false);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toLocaleDateString("en-CA");

  const filtered = (() => {
    switch (activeFilter) {
      case "missing_today":
        return participants.filter(
          (p) => p.last_checkin_date !== today && p.status === "active"
        );
      case "unpaid":
        return participants.filter(
          (p) => !p.payment_status || p.payment_status === "unpaid"
        );
      case "at_risk":
        return participants.filter(
          (p) => !p.last_checkin_date || p.last_checkin_date <= twoDaysAgoStr
        );
      case "all":
      default:
        return participants;
    }
  })();

  const emails = filtered.map((p) => p.email).filter(Boolean);

  const handleCopyEmails = async () => {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select from a temporary textarea
      const ta = document.createElement("textarea");
      ta.value = emails.join(", ");
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailAll = () => {
    const bcc = emails.join(",");
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}`;
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "missing_today", label: "Missing Today" },
    { key: "unpaid", label: "Unpaid" },
    { key: "at_risk", label: "At Risk" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-semibold text-gray-900">Contact List</span>
          <span className="text-sm text-gray-400">
            ({participants.length} participants)
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                  activeFilter === f.key
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-2">
              {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleEmailAll}
              disabled={emails.length === 0}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Email All ({emails.length})
            </button>
            <button
              onClick={handleCopyEmails}
              disabled={emails.length === 0}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy Emails"}
            </button>
          </div>

          {/* Contact list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">
                No contacts match this filter.
              </p>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.track_color && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.track_color }}
                      />
                    )}
                    <span className="font-medium text-gray-900 truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <a
                      href={`mailto:${p.email}`}
                      className="text-red-600 hover:text-red-700 hover:underline"
                      title={p.email}
                    >
                      {p.email}
                    </a>
                    {p.phone ? (
                      <a
                        href={`tel:${p.phone}`}
                        className="text-gray-500 hover:text-gray-700 hover:underline"
                        title={p.phone}
                      >
                        {p.phone}
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">No phone</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
