"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface BulkActionsProps {
  participants: { id: string; name: string }[];
}

type BulkAction = "activate" | "deactivate" | "mark_paid" | "mark_invoiced";

const ACTION_LABELS: Record<BulkAction, string> = {
  activate: "Activate",
  deactivate: "Deactivate",
  mark_paid: "Mark Paid",
  mark_invoiced: "Mark Invoiced",
};

export default function BulkActions({ participants }: BulkActionsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const allSelected =
    participants.length > 0 && selectedIds.size === participants.length;
  const someSelected = selectedIds.size > 0;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map((p) => p.id)));
    }
  }, [allSelected, participants]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const executeAction = useCallback(
    async (action: BulkAction) => {
      const count = selectedIds.size;
      const label = ACTION_LABELS[action].toLowerCase();
      const confirmed = window.confirm(
        `Are you sure you want to ${label} ${count} participant${count !== 1 ? "s" : ""}?`
      );
      if (!confirmed) return;

      setLoading(true);
      try {
        const res = await fetch("/api/participants/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            participant_ids: Array.from(selectedIds),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error ?? "Something went wrong");
          return;
        }
        setSelectedIds(new Set());
        router.refresh();
      } catch {
        alert("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedIds, router]
  );

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-3 mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Select All
        </label>

        {someSelected && (
          <>
            <span className="text-sm text-gray-500">
              {selectedIds.size} selected
            </span>
            <div className="h-5 w-px bg-gray-200" />
            {(Object.entries(ACTION_LABELS) as [BulkAction, string][]).map(
              ([action, label]) => (
                <button
                  key={action}
                  onClick={() => executeAction(action)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    action === "activate"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : action === "deactivate"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : action === "mark_paid"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </>
        )}
      </div>

      {/* Individual checkboxes rendered as a hidden helper —
          we expose toggleOne and selectedIds for the table to use */}
      <div className="hidden">
        {participants.map((p) => (
          <input
            key={p.id}
            type="checkbox"
            data-participant-id={p.id}
            checked={selectedIds.has(p.id)}
            onChange={() => toggleOne(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Export a companion component for table row checkboxes
export function BulkCheckbox({
  participantId,
  selectedIds,
  onToggle,
}: {
  participantId: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={selectedIds.has(participantId)}
      onChange={() => onToggle(participantId)}
      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
    />
  );
}
