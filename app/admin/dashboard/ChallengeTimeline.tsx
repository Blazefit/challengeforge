"use client";

import { useState } from "react";

interface TimelineItem {
  key: string;
  date: string;
  label: string;
  type: "milestone" | "marketing";
  status: "done" | "overdue" | "today" | "upcoming";
  detail?: string;
  actionLabel?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export default function ChallengeTimeline({
  startDate,
  endDate,
  challengeName,
  challengeId,
  marketingStatuses: initialMarketingStatuses,
}: {
  startDate: string;
  endDate: string;
  challengeName: string;
  challengeId: string;
  marketingStatuses: Record<string, string>;
}) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [marketingStatuses, setMarketingStatuses] = useState(initialMarketingStatuses);
  const [saving, setSaving] = useState(false);

  const today = getToday();

  function getDateStatus(dateStr: string): "done" | "overdue" | "today" | "upcoming" {
    if (dateStr < today) return "overdue";
    if (dateStr === today) return "today";
    return "upcoming";
  }

  // Build items
  const items: TimelineItem[] = [];

  // Milestones
  const milestones = [
    { key: "m-kickoff", date: startDate, label: "Challenge Kickoff", detail: "First day of check-ins" },
    { key: "m-week2", date: addDays(startDate, 7), label: "Week 2 Begins" },
    { key: "m-week3", date: addDays(startDate, 14), label: "Week 3 — Habits Forming" },
    { key: "m-week4", date: addDays(startDate, 21), label: "Week 4 — Midpoint Review", detail: "Generate mid-program adjustments" },
    { key: "m-week5", date: addDays(startDate, 28), label: "Week 5 — Keep Pushing" },
    { key: "m-week6", date: addDays(startDate, 35), label: "Week 6 — Murph Prep Begins", detail: "Generate Murph prep strategies" },
    { key: "m-week7", date: addDays(startDate, 42), label: "Week 7 — Final Push" },
    { key: "m-murph", date: endDate, label: "Murph Day / Challenge End", detail: "Generate post-program plans" },
  ];

  milestones.forEach((m) => {
    const dateStatus = getDateStatus(m.date);
    const manuallyDone = completedItems.has(m.key);
    items.push({
      ...m,
      type: "milestone",
      status: manuallyDone ? "done" : dateStatus === "overdue" ? "done" : dateStatus,
    });
  });

  // Marketing posts
  const marketingPosts = [
    { num: "1", date: addDays(startDate, -28), label: "Teaser / Announcement" },
    { num: "2", date: addDays(startDate, -24), label: "Track Reveal: Hard Gainer" },
    { num: "3", date: addDays(startDate, -21), label: "Track Reveal: Last 10" },
    { num: "4", date: addDays(startDate, -18), label: "Track Reveal: Transformer" },
    { num: "5", date: addDays(startDate, -14), label: "Tier Breakdown (Pricing)" },
    { num: "6", date: addDays(startDate, -7), label: "Early Bird Deadline" },
    { num: "7", date: addDays(startDate, -3), label: "Last Chance to Sign Up" },
    { num: "8", date: startDate, label: "Week 1 Kickoff Post" },
    { num: "9", date: addDays(startDate, 7), label: "Week 2 Momentum" },
    { num: "10", date: addDays(startDate, 14), label: "Week 3 Halfway Check" },
    { num: "11", date: addDays(startDate, 21), label: "Midpoint Celebration" },
    { num: "12", date: addDays(startDate, 28), label: "Week 5 Keep Pushing" },
    { num: "13", date: addDays(startDate, 35), label: "Final Stretch Begins" },
    { num: "14", date: addDays(startDate, 42), label: "One Week Left" },
    { num: "15", date: addDays(startDate, 49), label: "Murph Day Hype" },
    { num: "16", date: addDays(endDate, 3), label: "Results / Transformation Reveal" },
    { num: "17", date: addDays(endDate, 7), label: "Thank You / Next Challenge Tease" },
  ];

  marketingPosts.forEach((p) => {
    const mStatus = marketingStatuses[p.num];
    const dateStatus = getDateStatus(p.date);
    let status: TimelineItem["status"];
    let detail: string | undefined;

    if (mStatus === "posted") {
      status = "done";
      detail = "Posted";
    } else if (mStatus === "scheduled") {
      status = dateStatus === "overdue" ? "overdue" : "upcoming";
      detail = "Scheduled";
    } else {
      // draft or no status
      status = dateStatus === "overdue" ? "overdue" : dateStatus;
      detail = dateStatus === "overdue" ? "Not posted yet!" : "Draft";
    }

    items.push({
      key: `p-${p.num}`,
      date: p.date,
      label: `#${p.num} ${p.label}`,
      type: "marketing",
      status,
      detail,
    });
  });

  items.sort((a, b) => a.date.localeCompare(b.date));

  async function toggleMarkDone(key: string) {
    // For marketing posts, cycle the status
    if (key.startsWith("p-")) {
      const num = key.replace("p-", "");
      const current = marketingStatuses[num] ?? "draft";
      const next = current === "draft" ? "scheduled" : current === "scheduled" ? "posted" : "draft";
      const updated = { ...marketingStatuses, [num]: next };
      setMarketingStatuses(updated);

      setSaving(true);
      await fetch(`/api/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_statuses: updated }),
      }).catch(() => {});
      setSaving(false);
    } else {
      // For milestones, toggle done
      setCompletedItems((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  }

  const statusDot: Record<string, string> = {
    done: "bg-green-500",
    overdue: "bg-red-500 animate-pulse",
    today: "bg-red-500 ring-4 ring-red-200",
    upcoming: "bg-gray-300",
  };

  const statusLabel: Record<string, string> = {
    done: "text-green-600",
    overdue: "text-red-600 font-semibold",
    today: "text-red-600 font-semibold",
    upcoming: "text-gray-400",
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const overdueCount = items.filter((i) => i.status === "overdue").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Challenge Timeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {challengeName} &middot; {formatDate(startDate)} — {formatDate(endDate)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600 font-medium">{doneCount} done</span>
          {overdueCount > 0 && <span className="text-red-600 font-medium">{overdueCount} overdue</span>}
          <span className="text-gray-400">{items.length} total</span>
          {saving && <span className="text-gray-400">Saving...</span>}
        </div>
      </div>

      <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.key}
                className={`relative flex items-start gap-3 pl-1 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  item.status === "today" ? "bg-red-50" : item.status === "overdue" ? "bg-red-50/50" : ""
                }`}
                onClick={() => toggleMarkDone(item.key)}
                title={item.key.startsWith("p-") ? "Click to cycle: Draft → Scheduled → Posted" : "Click to mark done"}
              >
                <div className={`relative z-10 w-6 h-6 rounded-full ${statusDot[item.status]} flex items-center justify-center text-white text-[10px] flex-shrink-0`}>
                  {item.status === "done" ? "\u2713" : item.status === "overdue" ? "!" : ""}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs ${statusLabel[item.status]}`}>
                      {formatDate(item.date)}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      item.type === "marketing" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {item.type === "marketing" ? "Marketing" : "Milestone"}
                    </span>
                    {item.detail && (
                      <span className={`text-[10px] ${
                        item.status === "overdue" ? "text-red-500 font-semibold" : "text-gray-400"
                      }`}>{item.detail}</span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    item.status === "done" ? "text-gray-400 line-through" : item.status === "overdue" ? "text-red-700" : item.status === "today" ? "text-gray-900 font-medium" : "text-gray-600"
                  }`}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
