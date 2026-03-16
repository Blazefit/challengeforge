interface MilestonesProps {
  checkinCount: number;
  streak: number;
  weightChangePct: number | null;
  consistency: number;
  proteinAdherence: number;
}

const MILESTONES = [
  { icon: "\u{1F525}", label: "First Check-in", requirement: (p: MilestonesProps) => p.checkinCount >= 1 },
  { icon: "\u{1F4C5}", label: "One Week", requirement: (p: MilestonesProps) => p.checkinCount >= 7 },
  { icon: "\u{1F4AA}", label: "Two Weeks", requirement: (p: MilestonesProps) => p.checkinCount >= 14 },
  { icon: "\u{1F3C6}", label: "30 Days", requirement: (p: MilestonesProps) => p.checkinCount >= 30 },
  { icon: "\u{26A1}", label: "3-Day Streak", requirement: (p: MilestonesProps) => p.streak >= 3 },
  { icon: "\u{1F525}", label: "7-Day Streak", requirement: (p: MilestonesProps) => p.streak >= 7 },
  { icon: "\u{1F31F}", label: "14-Day Streak", requirement: (p: MilestonesProps) => p.streak >= 14 },
  { icon: "\u{1F451}", label: "21-Day Streak", requirement: (p: MilestonesProps) => p.streak >= 21 },
  { icon: "\u{1F969}", label: "Protein Pro", requirement: (p: MilestonesProps) => p.proteinAdherence >= 80 },
  { icon: "\u{1F4CA}", label: "80% Consistent", requirement: (p: MilestonesProps) => p.consistency >= 80 },
  { icon: "\u{1F4AF}", label: "100% Consistent", requirement: (p: MilestonesProps) => p.consistency >= 100 },
  { icon: "\u{1F4C9}", label: "First % Down", requirement: (p: MilestonesProps) => p.weightChangePct !== null && p.weightChangePct < 0 },
];

export default function Milestones(props: MilestonesProps) {
  const earned = MILESTONES.map((m, i) => ({ ...m, index: i, unlocked: m.requirement(props) }));
  const lastEarnedIndex = earned.reduce<number | null>(
    (last, m) => (m.unlocked ? m.index : last),
    null
  );

  return (
    <div className="bg-gray-900 rounded-xl p-5">
      <h2 className="font-bold mb-3 flex items-center gap-2">
        <span>&#127942;</span> Milestones
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {earned.map((m) => {
          const isLatest = m.index === lastEarnedIndex;
          return (
            <div
              key={`${m.label}-${m.index}`}
              className={`flex-shrink-0 flex flex-col items-center w-20 rounded-lg p-2 transition-all ${
                m.unlocked
                  ? isLatest
                    ? "bg-yellow-900/40 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                    : "bg-gray-800 border border-gray-700"
                  : "bg-gray-800/50 border border-gray-800 opacity-40"
              }`}
            >
              <span className={`text-2xl ${m.unlocked ? "" : "grayscale"}`}>
                {m.icon}
              </span>
              <span
                className={`text-[10px] mt-1 text-center leading-tight ${
                  m.unlocked ? "text-gray-200" : "text-gray-600"
                }`}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
      {earned.filter((m) => m.unlocked).length > 0 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {earned.filter((m) => m.unlocked).length} of {MILESTONES.length} milestones earned
        </p>
      )}
    </div>
  );
}
