"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DateNav({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigateDate(offset: number) {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const newDate = d.toLocaleDateString("en-CA");
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    router.push(`/admin/checkins?${params.toString()}`);
  }

  function goToToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`/admin/checkins?${params.toString()}`);
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const isToday = currentDate === today;

  const displayDate = new Date(currentDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigateDate(-1)}
        className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        title="Previous day"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
        {displayDate}
      </span>
      <button
        onClick={() => navigateDate(1)}
        disabled={isToday}
        className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next day"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {!isToday && (
        <button
          onClick={goToToday}
          className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  );
}
