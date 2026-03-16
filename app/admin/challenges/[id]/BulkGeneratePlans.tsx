"use client";

import { useState, useRef, useCallback } from "react";

interface Participant {
  id: string;
  name: string;
  has_plan: boolean;
}

interface Props {
  participants: Participant[];
}

export default function BulkGeneratePlans({ participants }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [succeeded, setSucceeded] = useState(0);
  const [failed, setFailed] = useState(0);
  const stopRef = useRef(false);

  const needsPlan = participants.filter((p) => !p.has_plan);

  const handleStop = useCallback(() => {
    stopRef.current = true;
  }, []);

  const handleGenerate = useCallback(async () => {
    const targets = needsPlan;
    if (targets.length === 0) return;

    stopRef.current = false;
    setStatus("running");
    setTotal(targets.length);
    setCurrent(0);
    setSucceeded(0);
    setFailed(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      if (stopRef.current) break;

      setCurrent(i + 1);

      try {
        const res = await fetch("/api/ai/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participant_id: targets[i].id }),
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
  }, [needsPlan]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setCurrent(0);
    setTotal(0);
    setSucceeded(0);
    setFailed(0);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">AI Nutrition Plans</h2>
        {needsPlan.length > 0 && status === "idle" && (
          <span className="text-sm text-gray-500">
            {needsPlan.length} participant{needsPlan.length !== 1 ? "s" : ""} without plans
          </span>
        )}
      </div>
      <div className="px-6 py-5">
        {status === "idle" && (
          <>
            {needsPlan.length === 0 ? (
              <p className="text-sm text-gray-500">
                All participants already have AI nutrition plans.
              </p>
            ) : (
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate All AI Plans
                <span className="bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {needsPlan.length}
                </span>
              </button>
            )}
          </>
        )}

        {status === "running" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 font-medium">
                Generating plan {current} of {total}...
              </p>
              <button
                onClick={handleStop}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                Stop
              </button>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {succeeded} succeeded{failed > 0 ? `, ${failed} failed` : ""}
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {failed === 0 ? (
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <p className="text-sm font-medium text-gray-900">
                Generated {succeeded} plan{succeeded !== 1 ? "s" : ""}.{" "}
                {failed} failed.
                {stopRef.current && current < total && (
                  <span className="text-gray-500 font-normal">
                    {" "}(Stopped early — {total - current} skipped)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
