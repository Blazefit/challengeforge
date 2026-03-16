"use client";

import { useState } from "react";

const CHAR_LIMIT = 200;

export default function AiFeedback({ feedback }: { feedback: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = feedback.length > CHAR_LIMIT;
  const displayText = !isLong || expanded ? feedback : feedback.slice(0, CHAR_LIMIT) + "…";

  return (
    <div className="mt-1 mb-1 ml-2 border-l-2 border-red-600 bg-gray-800/50 rounded-r-lg px-3 py-2">
      <p className="text-[11px] font-semibold text-red-400 italic mb-1">Coach Feedback:</p>
      <p className="text-xs text-gray-300 whitespace-pre-line">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-red-400 hover:text-red-300 mt-1 font-medium"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
