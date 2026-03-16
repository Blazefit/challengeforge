"use client";

import { useState } from "react";

interface PlanTabsProps {
  nutritionPlan: string;
  trainingPlan: string;
}

function renderSimpleMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 text-sm text-gray-300 mb-3">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const boldify = (str: string): React.ReactNode => {
    const parts = str.split(/\*\*(.+?)\*\*/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h-${i}`} className="text-white font-bold text-base mt-4 mb-2">
          {boldify(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(
        <li key={`li-${i}`}>{boldify(trimmed.slice(2))}</li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm text-gray-300 mb-2">
          {boldify(trimmed)}
        </p>
      );
    }
  }

  flushList();
  return elements;
}

export default function PlanTabs({ nutritionPlan, trainingPlan }: PlanTabsProps) {
  const [activeTab, setActiveTab] = useState<"nutrition" | "training">("nutrition");

  const tabs = [
    { key: "nutrition" as const, label: "Nutrition", content: nutritionPlan },
    { key: "training" as const, label: "Training", content: trainingPlan },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto pr-1">
        {renderSimpleMarkdown(
          activeTab === "nutrition" ? nutritionPlan : trainingPlan
        )}
      </div>
    </div>
  );
}
