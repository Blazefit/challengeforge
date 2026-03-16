interface ChallengeBannerProps {
  challengeName: string;
  startDate: string;  // "2026-04-01"
  endDate: string;    // "2026-05-23"
  trackName: string;
  trackIcon: string;
  trackColor: string;
}

export default function ChallengeBanner({
  challengeName,
  startDate,
  endDate,
  trackName,
  trackIcon,
  trackColor,
}: ChallengeBannerProps) {
  const now = new Date();
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const daysIn = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / 86400000);
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / 86400000);

  const phase = now < start ? "pre" : now > end ? "complete" : "active";
  const weekNum = Math.floor(daysIn / 7) + 1;
  const dayOfWeek = (daysIn % 7) + 1;
  const progressPct =
    phase === "active"
      ? Math.round((daysIn / totalDays) * 100)
      : phase === "complete"
        ? 100
        : 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 border-b border-gray-700/50">
      <div className="max-w-lg mx-auto px-4 py-4">
        {phase === "pre" && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{trackIcon}</span>
              <span className="text-sm font-semibold" style={{ color: trackColor }}>
                {trackName}
              </span>
            </div>
            <p className="text-gray-300 text-sm font-medium">
              {challengeName} starts in{" "}
              <span className="text-white font-bold text-lg">{daysUntilStart}</span>{" "}
              {daysUntilStart === 1 ? "day" : "days"}
            </p>
            <p className="text-gray-500 text-xs">
              Get ready -- your transformation journey is about to begin!
            </p>
          </div>
        )}

        {phase === "active" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{trackIcon}</span>
                <span className="text-sm font-bold text-white">
                  Week {weekNum} of {Math.ceil(totalDays / 7)}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-xs text-gray-400">Day {dayOfWeek}</span>
              </div>
              <span className="text-xs font-medium" style={{ color: trackColor }}>
                {daysRemaining}d remaining
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, progressPct))}%`,
                    backgroundColor: trackColor || "#6366f1",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>{progressPct}% complete</span>
                <span>{challengeName}</span>
              </div>
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="text-center space-y-2">
            <p className="text-2xl">&#127942;</p>
            <p className="text-lg font-bold text-white">Challenge Complete!</p>
            <p className="text-gray-400 text-sm">
              Congratulations on finishing {challengeName}! Check your final results on the leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
