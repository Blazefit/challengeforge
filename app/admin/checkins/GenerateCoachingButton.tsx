"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  checkinIds: string[];
}

export default function GenerateCoachingButton({ checkinIds }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [current, setCurrent] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const stopRef = useRef(false);

  const handleGenerate = useCallback(async () => {
    if (checkinIds.length === 0) return;

    stopRef.current = false;
    setStatus("running");
    setCurrent(0);
    setSucceeded(0);
    setFailed(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < checkinIds.length; i++) {
      if (stopRef.current) break;
      setCurrent(i + 1);

      try {
        const res = await fetch("/api/ai/coaching-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkinId: checkinIds[i] }),
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }

      setSucceeded(successCount);
      setFailed(failCount);
    }

    setStatus("done");
  }, [checkinIds]);

  if (checkinIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {status === "idle" && (
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate AI Coaching Feedback
          <span className="bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {checkinIds.length}
          </span>
        </button>
      )}

      {status === "running" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Generating {current} of {checkinIds.length}...
          </span>
          <button
            onClick={() => { stopRef.current = true; }}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 border border-red-200"
          >
            Stop
          </button>
        </div>
      )}

      {status === "done" && (
        <span className="text-sm text-gray-600">
          Done — {succeeded} feedback{succeeded !== 1 ? "s" : ""} generated
          {failed > 0 ? `, ${failed} failed` : ""}
        </span>
      )}
    </div>
  );
}
