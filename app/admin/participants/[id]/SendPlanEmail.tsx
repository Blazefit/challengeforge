"use client";

import { useState } from "react";

interface Props {
  participantEmail: string;
  participantName: string;
  planTitle: string;
  planContent: string;
}

export default function SendPlanEmail({ participantEmail, participantName, planTitle, planContent }: Props) {
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  const firstName = participantName.split(" ")[0];

  const subject = `Your ${planTitle} is ready, ${firstName}!`;

  // Strip markdown formatting for plain text email
  const cleanContent = planContent
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .substring(0, 8000);

  const body = `Hey ${firstName},

Your ${planTitle.toLowerCase()} is ready! Here it is:

${"─".repeat(40)}

${cleanContent}

${"─".repeat(40)}

You can also view this anytime on your personal dashboard.

Let's get after it!

Coach Jason
CrossFit Blaze`;

  function handleCopy(type: "subject" | "body") {
    const text = type === "subject" ? subject : body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="inline-block">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmail((v) => !v); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {showEmail ? "Hide" : "Email to Participant"}
      </button>

      {showEmail && (
        <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 p-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            To: {participantEmail}
          </p>

          {/* Send buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(participantEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
              </svg>
              Gmail
            </a>
            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(participantEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#0078D4"/>
              </svg>
              Outlook
            </a>
            <a
              href={`mailto:${participantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Client
            </a>
          </div>

          {/* Subject */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Subject</label>
              <button onClick={() => handleCopy("subject")} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                {copied === "subject" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded px-3 py-2">{subject}</p>
          </div>

          {/* Body preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Body</label>
              <button onClick={() => handleCopy("body")} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                {copied === "body" ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={body}
              rows={10}
              className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded px-3 py-2 resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
