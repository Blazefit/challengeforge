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

const typeConfig: Record<string, { icon: string; bg: string }> = {
  checkin: { icon: "\u2713", bg: "rgba(125, 220, 142, 0.2)" },
  signup: { icon: "+", bg: "rgba(128, 131, 255, 0.2)" },
  plan: { icon: "\u2699", bg: "rgba(221, 183, 255, 0.2)" },
};

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
          if (!oldTimes.has(key)) freshIds.add(key);
        }
        if (freshIds.size > 0) {
          setNewItemIds(freshIds);
          setTimeout(() => setNewItemIds(new Set()), 2000);
        }
      }

      setItems(data);
    } catch {
      // Silently fail
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
    <div className="mt-8" style={{ background: "var(--surface-container-high)", borderRadius: "var(--radius-lg)" }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
        <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Recent Activity</h2>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--on-surface-muted)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--success)" }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--success)" }}></span>
          </span>
          Live
        </span>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm" style={{ color: "var(--on-surface-muted)" }}>Loading activity...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm" style={{ color: "var(--on-surface-muted)" }}>No recent activity</p>
        </div>
      ) : (
        <div>
          {items.map((item) => {
            const key = `${item.type}-${item.name}-${item.time}`;
            const isNew = newItemIds.has(key);
            const config = typeConfig[item.type] ?? typeConfig.checkin;
            return (
              <div
                key={key}
                className="px-6 py-3 flex items-center gap-3 transition-colors"
                style={{
                  borderBottom: "1px solid rgba(70, 69, 84, 0.08)",
                  background: isNew ? "rgba(125, 220, 142, 0.05)" : "transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: config.bg, color: "var(--on-surface)" }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--on-surface)" }}>
                    <span className="font-medium">{item.name}</span>
                    {item.track && (
                      <span
                        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: item.trackColor ? `${item.trackColor}30` : "var(--surface-bright)", color: item.trackColor ?? "var(--on-surface-variant)" }}
                      >
                        {item.track}
                      </span>
                    )}
                    <span className="ml-1" style={{ color: "var(--on-surface-muted)" }}>
                      {item.type === "checkin" && "checked in"}
                      {item.type === "signup" && "signed up"}
                      {item.type === "plan" && "got a nutrition plan"}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: "var(--on-surface-muted)" }}>{item.detail}</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--on-surface-muted)" }}>{timeAgo(item.time)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
