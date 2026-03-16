"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function CoachNotes({
  participantId,
  initialNotes,
}: {
  participantId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const saveNotes = useCallback(
    async (value: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/participants/${participantId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("idle");
        }
      } catch {
        setSaveStatus("idle");
      }
    },
    [participantId]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSaveStatus("idle");
    timerRef.current = setTimeout(() => {
      saveNotes(notes);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notes, saveNotes]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Coach Notes</h2>
        {saveStatus === "saving" && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private notes about this participant..."
        rows={4}
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-300 focus:ring-1 focus:ring-red-300 outline-none resize-y"
      />
    </div>
  );
}
