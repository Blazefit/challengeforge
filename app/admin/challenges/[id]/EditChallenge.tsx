"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditChallengeProps {
  challenge: {
    id: string;
    name: string;
    slug: string;
    status: string;
    start_date: string;
    end_date: string;
    announcement?: string | null;
  };
}

export default function EditChallenge({ challenge }: EditChallengeProps) {
  const router = useRouter();
  const [name, setName] = useState(challenge.name);
  const [slug, setSlug] = useState(challenge.slug);
  const [status, setStatus] = useState(challenge.status);
  const [startDate, setStartDate] = useState(challenge.start_date);
  const [endDate, setEndDate] = useState(challenge.end_date);
  const [announcement, setAnnouncement] = useState(challenge.announcement || "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          status,
          start_date: startDate,
          end_date: endDate,
          announcement: announcement.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      setFeedback({ type: "success", message: "Challenge updated successfully." });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Challenge Settings</h2>
      </div>
      <div className="p-6 space-y-5">
        {feedback && (
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="challenge-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="challenge-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="challenge-slug" className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              id="challenge-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="challenge-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="challenge-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="hidden sm:block" />

          <div>
            <label htmlFor="challenge-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="challenge-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="challenge-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="challenge-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Announcement Banner */}
        <div>
          <label htmlFor="challenge-announcement" className="block text-sm font-medium text-gray-700 mb-1">
            Participant Announcement
          </label>
          <textarea
            id="challenge-announcement"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={3}
            placeholder="Set an announcement that shows on all participant dashboards (leave empty to hide)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">
            {announcement.trim() ? "This message is visible to all participants right now." : "No announcement set. Participants won't see anything."}
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
