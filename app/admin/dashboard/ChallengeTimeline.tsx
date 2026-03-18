"use client";

interface TimelineItem {
  date: string;
  label: string;
  type: "milestone" | "marketing" | "email";
  status: "done" | "today" | "upcoming";
  detail?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getStatus(dateStr: string): "done" | "today" | "upcoming" {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  if (dateStr < today) return "done";
  if (dateStr === today) return "today";
  return "upcoming";
}

const statusStyles = {
  done: "bg-green-500 border-green-500",
  today: "bg-red-500 border-red-500 ring-4 ring-red-200",
  upcoming: "bg-gray-300 border-gray-300",
};

const statusText = {
  done: "text-green-700",
  today: "text-red-700 font-semibold",
  upcoming: "text-gray-500",
};

export default function ChallengeTimeline({
  startDate,
  endDate,
  challengeName,
  marketingStatuses,
}: {
  startDate: string;
  endDate: string;
  challengeName: string;
  marketingStatuses: Record<string, string>;
}) {
  // Build timeline items
  const items: TimelineItem[] = [];

  // Milestones
  items.push({ date: startDate, label: "Challenge Kickoff", type: "milestone", status: getStatus(startDate) });
  items.push({ date: addDays(startDate, 7), label: "Week 2 Begins", type: "milestone", status: getStatus(addDays(startDate, 7)) });
  items.push({ date: addDays(startDate, 14), label: "Week 3 — Habits Forming", type: "milestone", status: getStatus(addDays(startDate, 14)) });
  items.push({ date: addDays(startDate, 21), label: "Week 4 — Midpoint Review", type: "milestone", status: getStatus(addDays(startDate, 21)), detail: "Generate mid-program adjustments" });
  items.push({ date: addDays(startDate, 28), label: "Week 5 — Keep Pushing", type: "milestone", status: getStatus(addDays(startDate, 28)) });
  items.push({ date: addDays(startDate, 35), label: "Week 6 — Murph Prep", type: "milestone", status: getStatus(addDays(startDate, 35)), detail: "Generate Murph prep strategies" });
  items.push({ date: addDays(startDate, 42), label: "Week 7 — Final Week", type: "milestone", status: getStatus(addDays(startDate, 42)) });
  items.push({ date: endDate, label: "Murph Day / Challenge End", type: "milestone", status: getStatus(endDate), detail: "Generate post-program plans" });

  // Marketing posts (key ones)
  const marketingPosts = [
    { num: "1", date: addDays(startDate, -28), label: "Post: Teaser / Announcement" },
    { num: "5", date: addDays(startDate, -14), label: "Post: Tier Breakdown" },
    { num: "6", date: addDays(startDate, -7), label: "Post: Early Bird Deadline" },
    { num: "7", date: addDays(startDate, -3), label: "Post: Last Chance Signup" },
    { num: "8", date: startDate, label: "Post: Week 1 Kickoff" },
    { num: "11", date: addDays(startDate, 21), label: "Post: Midpoint Celebration" },
    { num: "15", date: addDays(startDate, 49), label: "Post: Murph Day Hype" },
    { num: "16", date: addDays(endDate, 3), label: "Post: Results Reveal" },
    { num: "17", date: addDays(endDate, 7), label: "Post: Thank You / Next Tease" },
  ];

  marketingPosts.forEach((p) => {
    const mStatus = marketingStatuses[p.num];
    const isDone = mStatus === "posted";
    const isScheduled = mStatus === "scheduled";
    items.push({
      date: p.date,
      label: p.label,
      type: "marketing",
      status: isDone ? "done" : isScheduled ? "today" : getStatus(p.date) === "done" ? "upcoming" : "upcoming",
      detail: isDone ? "Posted" : isScheduled ? "Scheduled" : mStatus === "draft" ? "Draft" : undefined,
    });
  });

  // Sort by date
  items.sort((a, b) => a.date.localeCompare(b.date));

  // Group by week
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Challenge Timeline</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {challengeName} &middot; {formatDate(startDate)} — {formatDate(endDate)}
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-3">
            {items.map((item, i) => {
              const isToday = item.date === today;
              const typeColor = item.type === "milestone" ? "text-gray-800" : item.type === "marketing" ? "text-blue-700" : "text-green-700";
              const typeBg = item.type === "milestone" ? "" : item.type === "marketing" ? "bg-blue-50" : "bg-green-50";

              return (
                <div key={`${item.date}-${i}`} className={`relative flex items-start gap-3 pl-1 ${isToday ? "py-1" : ""}`}>
                  {/* Dot */}
                  <div className={`relative z-10 w-6 h-6 rounded-full ${statusStyles[item.status]} flex items-center justify-center text-white text-[10px] flex-shrink-0`}>
                    {item.status === "done" ? "\u2713" : item.status === "today" ? "\u25CF" : ""}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${statusText[item.status]}`}>
                        {formatDate(item.date)}
                      </span>
                      {item.type !== "milestone" && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBg} ${typeColor}`}>
                          {item.type === "marketing" ? "Marketing" : "Email"}
                        </span>
                      )}
                      {item.detail && (
                        <span className="text-[10px] text-gray-400">{item.detail}</span>
                      )}
                    </div>
                    <p className={`text-sm ${item.status === "done" ? "text-gray-400 line-through" : item.status === "today" ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
