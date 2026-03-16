"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("pwa-install-dismissed");

    if (!isStandalone && !dismissed) {
      setShow(true);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShow(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-3 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="text-sm">
          <p className="font-medium text-white">Add to Home Screen</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {isIOS
              ? "Tap the share button, then \"Add to Home Screen\""
              : "Quick access to daily check-ins from your home screen"
            }
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-500 hover:text-white text-sm ml-3"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
