"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface EditParticipantProps {
  participantId: string;
  currentStatus: string;
  currentTrackId: string | null;
  currentTierId: string | null;
  currentPaymentStatus: string;
  tracks: { id: string; name: string }[];
  tiers: { id: string; name: string }[];
}

export default function EditParticipant({
  participantId,
  currentStatus,
  currentTrackId,
  currentTierId,
  currentPaymentStatus,
  tracks,
  tiers,
}: EditParticipantProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [trackId, setTrackId] = useState(currentTrackId ?? "");
  const [tierId, setTierId] = useState(currentTierId ?? "");
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const saveField = useCallback(
    async (field: string, value: string | null) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/participants/${participantId}/edit`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          router.refresh();
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("idle");
        }
      } catch {
        setSaveStatus("idle");
      }
    },
    [participantId, router]
  );

  const handleStatusChange = (value: string) => {
    setStatus(value);
    saveField("status", value);
  };

  const handleTrackChange = (value: string) => {
    setTrackId(value);
    saveField("track_id", value || null);
  };

  const handleTierChange = (value: string) => {
    setTierId(value);
    saveField("tier_id", value || null);
  };

  const handlePaymentStatusChange = (value: string) => {
    setPaymentStatus(value);
    saveField("payment_status", value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Edit Participant</h2>
        {saveStatus === "saving" && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Track</label>
          <select
            value={trackId}
            onChange={(e) => handleTrackChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="">No Track</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tier</label>
          <select
            value={tierId}
            onChange={(e) => handleTierChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="">No Tier</option>
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => handlePaymentStatusChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none"
          >
            <option value="unpaid">Unpaid</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
    </div>
  );
}
