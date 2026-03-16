"use client";

import { useState } from "react";

interface Props {
  participantId: string;
  endpoint: string;
  label: string;
  regenerateLabel: string;
  hasContent: boolean;
  extraBody?: Record<string, unknown>;
}

export default function AiActionButton({
  participantId,
  endpoint,
  label,
  regenerateLabel,
  hasContent,
  extraBody,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId, ...extraBody }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate");
      }

      setStatus("success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : hasContent ? (
          regenerateLabel
        ) : (
          label
        )}
      </button>
      {status === "success" && <span className="text-xs text-green-600 font-medium">Done!</span>}
      {status === "error" && <span className="text-xs text-red-600 font-medium">{errorMessage}</span>}
    </div>
  );
}
