"use client";

import { useState, useEffect, useCallback } from "react";

interface ActivityItem {
  type: "checkin" | "signup" | "plan";
  name: string;
  track: string | null;
  trackColor: string | null;
  time: string;
  detail: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  switch (type) {
    case "checkin":
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "signup":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    case "plan":
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
          </svg>
        </div>
      );
  }
}

export default function ActivityFeed({ initialItems }: { initialItems: ActivityItem[] }) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(initialItems.length === 0);

  const fetchActivity = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch("/api/admin/activity");
      if (!res.ok) return;
      const data: ActivityItem[] = await res.json();

      if (!isInitial && items.length > 0) {
        const oldTimes = new Set(items.map((i) => `${i.type}-${i.name}-${i.time}`));
        const freshIds = new Set<string>();
        for (const item of data) {
          const key = `${item.type}-${item.name}-${item.time}`;
          if (!oldTimes.has(key)) {
            freshIds.add(key);
          }
        }
        if (freshIds.size > 0) {
          setNewItemIds(freshIds);
          setTimeout(() => setNewItemIds(new Set()), 2000);
        }
      }

      setItems(data);
    } catch {
      // Silently fail on fetch errors
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    fetchActivity(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => fetchActivity(false), 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Recent Activity</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </span>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">Loading activity...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const key = `${item.type}-${item.name}-${item.time}`;
            const isNew = newItemIds.has(key);
            return (
              <div
                key={key}
                className={`px-6 py-3 flex items-center gap-3 transition-colors ${
                  isNew ? "animate-pulse bg-green-50" : ""
                }`}
              >
                <ActivityIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{item.name}</span>
                    {item.track && (
                      <span
                        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{ backgroundColor: item.trackColor ?? "#6b7280" }}
                      >
                        {item.track}
                      </span>
                    )}
                    <span className="text-gray-500 ml-1">
                      {item.type === "checkin" && "checked in"}
                      {item.type === "signup" && "signed up"}
                      {item.type === "plan" && "got a nutrition plan"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(item.time)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
