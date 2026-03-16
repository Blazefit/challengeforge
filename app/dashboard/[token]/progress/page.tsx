import { getParticipantByToken } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Checkin {
  id: string;
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: string | null;
  steps: number | null;
  recovery_score: number | null;
  notes: string | null;
  participant_id: string;
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function WeightChart({
  dataPoints,
  goalWeight,
  gainIsGood,
}: {
  dataPoints: { date: string; weight: number }[];
  goalWeight: number | null;
  gainIsGood: boolean;
}) {
  if (dataPoints.length < 2) return null;

  const width = 400;
  const height = 160;
  const pad = { top: 20, right: 10, bottom: 30, left: 45 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const weights = dataPoints.map((d) => d.weight);
  const allWeights = goalWeight ? [...weights, goalWeight] : weights;
  const minW = Math.min(...allWeights) - 1;
  const maxW = Math.max(...allWeights) + 1;
  const range = maxW - minW || 1;

  const x = (i: number) => pad.left + (i / (dataPoints.length - 1)) * chartW;
  const y = (w: number) => pad.top + chartH - ((w - minW) / range) * chartH;

  const pathD = dataPoints
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.weight).toFixed(1)}`)
    .join(" ");

  // Area fill
  const areaD = pathD + ` L ${x(dataPoints.length - 1).toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${pad.left} ${(pad.top + chartH).toFixed(1)} Z`;

  const trendUp = weights[weights.length - 1] > weights[0];
  const lineColor = (trendUp && gainIsGood) || (!trendUp && !gainIsGood) ? "#22c55e" : "#ef4444";

  // Y-axis labels (3 ticks)
  const yTicks = [minW, minW + range / 2, maxW].map((v) => Math.round(v * 10) / 10);

  // X-axis labels (first, middle, last)
  const xLabels = [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1]
    .filter((i, idx, arr) => arr.indexOf(i) === idx)
    .map((i) => ({ i, label: formatDate(dataPoints[i].date) }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} y1={y(tick)} x2={width - pad.right} y2={y(tick)} stroke="#374151" strokeWidth="0.5" />
          <text x={pad.left - 5} y={y(tick) + 3} textAnchor="end" fill="#6b7280" fontSize="10">{tick}</text>
        </g>
      ))}
      {/* Goal line */}
      {goalWeight && goalWeight >= minW && goalWeight <= maxW && (
        <g>
          <line x1={pad.left} y1={y(goalWeight)} x2={width - pad.right} y2={y(goalWeight)} stroke="#facc15" strokeWidth="1" strokeDasharray="4 3" />
          <text x={width - pad.right + 2} y={y(goalWeight) + 3} fill="#facc15" fontSize="9">Goal</text>
        </g>
      )}
      {/* Area */}
      <path d={areaD} fill={lineColor} opacity="0.1" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {dataPoints.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.weight)} r="3" fill={lineColor} />
      ))}
      {/* X-axis labels */}
      {xLabels.map(({ i, label }) => (
        <text key={i} x={x(i)} y={height - 5} textAnchor="middle" fill="#6b7280" fontSize="9">{label}</text>
      ))}
    </svg>
  );
}

function formatWeekRange(mondayStr: string): string {
  const mon = new Date(mondayStr + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return `${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default async function MyProgress({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();

  const supabase = createAdminClient();
  const track = participant.tracks as { name: string; scoring_direction: string } | null;
  const challenge = participant.challenges as { start_date: string; end_date: string } | null;
  const intake = participant.intake_pre as { weight?: number; goal_weight?: number } | null;

  // Fetch all checkins ordered by date ascending
  const { data: rawCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("participant_id", participant.id)
    .order("date", { ascending: true });

  const checkins: Checkin[] = rawCheckins || [];

  // Determine direction: true means weight gain is good
  const gainIsGood = track?.scoring_direction === "gain";

  // Starting weight from intake
  const startingWeight = intake?.weight ?? null;

  // Current weight: latest checkin with a weight value
  const checkinsWithWeight = checkins.filter((c) => c.weight != null);
  const latestWeightCheckin = checkinsWithWeight.length > 0 ? checkinsWithWeight[checkinsWithWeight.length - 1] : null;
  const currentWeight = latestWeightCheckin?.weight ?? null;

  // Weight change
  const weightChange = startingWeight != null && currentWeight != null ? currentWeight - startingWeight : null;

  // Is the change in the right direction?
  function isGoodDirection(change: number): boolean {
    if (change === 0) return true;
    return gainIsGood ? change > 0 : change < 0;
  }

  // Consistency
  let consistency = 0;
  let daysSinceStart = 0;
  if (challenge) {
    const start = new Date(challenge.start_date);
    const now = new Date();
    daysSinceStart = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000));
    consistency = Math.min(100, Math.round((checkins.length / daysSinceStart) * 100));
  }

  // Build weight history (most recent first) with change from previous
  const weightHistory: {
    date: string;
    weight: number | null;
    change: number | null;
    protein_hit: string | null;
    trained: string | null;
    recovery_score: number | null;
  }[] = [];

  // Walk ascending to compute change from previous
  let prevWeight: number | null = null;
  const ascEntries: typeof weightHistory = [];
  for (const c of checkins) {
    const change = c.weight != null && prevWeight != null ? c.weight - prevWeight : null;
    ascEntries.push({
      date: c.date,
      weight: c.weight,
      change,
      protein_hit: c.protein_hit,
      trained: c.trained,
      recovery_score: c.recovery_score,
    });
    if (c.weight != null) prevWeight = c.weight;
  }
  // Reverse for display (most recent first)
  for (let i = ascEntries.length - 1; i >= 0; i--) {
    weightHistory.push(ascEntries[i]);
  }

  // Weekly summaries
  const weekMap = new Map<string, Checkin[]>();
  for (const c of checkins) {
    const mon = getMonday(c.date);
    if (!weekMap.has(mon)) weekMap.set(mon, []);
    weekMap.get(mon)!.push(c);
  }

  const weeklySummaries = Array.from(weekMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // most recent week first
    .map(([monday, weekCheckins]) => {
      const weights = weekCheckins.filter((c) => c.weight != null).map((c) => c.weight!);
      const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null;
      const proteinYes = weekCheckins.filter((c) => c.protein_hit === "yes").length;
      const proteinTotal = weekCheckins.filter((c) => c.protein_hit != null).length;
      const proteinPct = proteinTotal > 0 ? Math.round((proteinYes / proteinTotal) * 100) : null;
      const trainingDays = weekCheckins.filter((c) => c.trained === "yes").length;

      return {
        weekLabel: formatWeekRange(monday),
        checkinCount: weekCheckins.length,
        avgWeight,
        proteinPct,
        trainingDays,
      };
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-5 border-b border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">My Progress</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {track?.name} Track
              {gainIsGood ? " — Weight gain focus" : " — Weight loss focus"}
            </p>
          </div>
          <Link
            href={`/dashboard/${token}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress Summary */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="font-bold mb-4 text-lg">Progress Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{startingWeight ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Starting Weight</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{currentWeight ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Current Weight</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              {weightChange !== null ? (
                <p
                  className={`text-2xl font-bold ${
                    weightChange === 0
                      ? "text-gray-400"
                      : isGoodDirection(weightChange)
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {weightChange > 0 ? "+" : ""}
                  {weightChange.toFixed(1)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-500">—</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Weight Change</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{checkins.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total Check-ins</p>
            </div>
          </div>
          {/* Consistency bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Consistency</span>
              <span className="font-bold">{consistency}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  consistency >= 80
                    ? "bg-green-500"
                    : consistency >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${consistency}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {checkins.length} check-ins / {daysSinceStart} days
            </p>
          </div>
        </div>

        {/* Weight Trend Chart */}
        {checkinsWithWeight.length >= 2 && (
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="font-bold mb-4 text-lg">Weight Trend</h2>
            <WeightChart
              dataPoints={checkinsWithWeight.map((c) => ({ date: c.date, weight: c.weight! }))}
              goalWeight={intake?.goal_weight ?? null}
              gainIsGood={gainIsGood}
            />
          </div>
        )}

        {/* Starting Photos */}
        {participant.starting_photos && (() => {
          const photos = participant.starting_photos as Record<string, string>;
          const hasPhotos = Object.values(photos).some(Boolean);
          if (!hasPhotos) return null;
          return (
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-bold mb-4 text-lg">Starting Photos</h2>
              <div className="grid grid-cols-3 gap-3">
                {["front", "side", "back"].map((angle) => (
                  photos[angle] ? (
                    <div key={angle} className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photos[angle]}
                        alt={`${angle} photo`}
                        className="w-full aspect-[3/4] object-cover rounded-lg border border-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1 capitalize">{angle}</p>
                    </div>
                  ) : (
                    <div key={angle} className="flex items-center justify-center aspect-[3/4] rounded-lg border-2 border-dashed border-gray-700 bg-gray-800">
                      <p className="text-xs text-gray-600 capitalize">{angle}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })()}

        {/* Weight History Table */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="font-bold mb-4 text-lg">Weight History</h2>
          {weightHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No check-ins yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2 px-2 font-medium">Date</th>
                    <th className="text-right py-2 px-2 font-medium">Weight</th>
                    <th className="text-right py-2 px-2 font-medium">Change</th>
                    <th className="text-center py-2 px-2 font-medium">Protein</th>
                    <th className="text-center py-2 px-2 font-medium">Train</th>
                    <th className="text-center py-2 px-2 font-medium">Rec</th>
                  </tr>
                </thead>
                <tbody>
                  {weightHistory.map((row) => (
                    <tr key={row.date} className="border-b border-gray-800/50">
                      <td className="py-2 px-2 text-gray-300 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {row.weight ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {row.change !== null ? (
                          <span
                            className={
                              row.change === 0
                                ? "text-gray-500"
                                : isGoodDirection(row.change)
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {row.change > 0 ? "+" : ""}
                            {row.change.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.protein_hit ? (
                          <span
                            className={
                              row.protein_hit === "yes"
                                ? "text-green-400"
                                : row.protein_hit === "close"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {row.protein_hit === "yes"
                              ? "\u2713"
                              : row.protein_hit === "close"
                              ? "~"
                              : "\u2717"}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {row.trained ? (
                          <span
                            className={
                              row.trained === "yes"
                                ? "text-green-400"
                                : row.trained === "rest_day"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {row.trained === "yes"
                              ? "\u2713"
                              : row.trained === "rest_day"
                              ? "R"
                              : "\u2717"}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-400">
                        {row.recovery_score ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Weekly Summaries */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="font-bold mb-4 text-lg">Weekly Summary</h2>
          {weeklySummaries.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {weeklySummaries.map((week) => (
                <div
                  key={week.weekLabel}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <p className="text-sm font-medium text-gray-300 mb-3">
                    {week.weekLabel}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">
                        {week.avgWeight !== null
                          ? week.avgWeight.toFixed(1)
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-500">Avg Wt</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{week.checkinCount}</p>
                      <p className="text-xs text-gray-500">Check-ins</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {week.proteinPct !== null ? `${week.proteinPct}%` : "—"}
                      </p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{week.trainingDays}</p>
                      <p className="text-xs text-gray-500">Train Days</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/${token}`}
            className="flex-1 text-center py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            href={`/dashboard/${token}/checkin`}
            className="flex-1 text-center py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700"
          >
            Check In
          </Link>
        </div>
      </div>
    </div>
  );
}
