export interface ScoredParticipant {
  id: string;
  name: string;
  track_name: string;
  track_icon: string;
  track_color: string;
  scoring_direction: string;
  first_weight: number | null;
  latest_weight: number | null;
  weight_change_pct: number;
  consistency_pct: number;
  protein_adherence_pct: number;
  step_days_pct: number;
  score: number;
  rank: number;
  total_checkins: number;
}

interface ParticipantRecord {
  id: string;
  name: string;
  intake_pre: { weight?: number; goal_weight?: number } | null;
  tracks: { name: string; icon: string; color: string; scoring_direction: string } | null;
}

interface CheckinRecord {
  participant_id: string;
  date: string;
  weight: number | null;
  protein_hit: string | null;
  steps: number | null;
}

export function computeLeaderboard(
  participants: ParticipantRecord[],
  checkins: CheckinRecord[],
  challengeStartDate: string
): ScoredParticipant[] {
  const now = new Date();
  const start = new Date(challengeStartDate);
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000));

  const checkinsByParticipant = new Map<string, CheckinRecord[]>();
  for (const c of checkins) {
    const list = checkinsByParticipant.get(c.participant_id) || [];
    list.push(c);
    checkinsByParticipant.set(c.participant_id, list);
  }

  const scored: ScoredParticipant[] = participants.map((p) => {
    const pCheckins = checkinsByParticipant.get(p.id) || [];
    const track = p.tracks;
    const direction = track?.scoring_direction || "lose";

    // Weight calculations
    const weightsWithDates = pCheckins
      .filter((c) => c.weight != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    const startingWeight = p.intake_pre?.weight || (weightsWithDates[0]?.weight ?? null);
    const latestWeight = weightsWithDates.length > 0 ? weightsWithDates[weightsWithDates.length - 1].weight : null;

    let weightChangePct = 0;
    if (startingWeight && latestWeight) {
      const rawChange = ((latestWeight - startingWeight) / startingWeight) * 100;
      weightChangePct = direction === "gain" ? rawChange : -rawChange;
    }

    // Consistency
    const consistencyPct = Math.min(100, (pCheckins.length / daysElapsed) * 100);

    // Protein adherence
    const proteinCheckins = pCheckins.filter((c) => c.protein_hit != null);
    const proteinHits = proteinCheckins.filter((c) => c.protein_hit === "yes").length;
    const proteinAdherencePct = proteinCheckins.length > 0 ? (proteinHits / proteinCheckins.length) * 100 : 0;

    // Step days (10K+)
    const stepDays = pCheckins.filter((c) => c.steps != null && c.steps >= 10000).length;
    const stepDaysPct = pCheckins.length > 0 ? (stepDays / pCheckins.length) * 100 : 0;

    // Composite score by track
    let score = 0;
    const trackName = track?.name || "";
    if (trackName === "Hard Gainer") {
      score = 0.5 * weightChangePct + 0.3 * consistencyPct + 0.2 * proteinAdherencePct;
    } else if (trackName === "Last 10") {
      score = 0.5 * weightChangePct + 0.25 * consistencyPct + 0.25 * stepDaysPct;
    } else {
      // Transformer
      score = 0.35 * weightChangePct + 0.35 * consistencyPct + 0.3 * proteinAdherencePct;
    }

    return {
      id: p.id,
      name: p.name,
      track_name: track?.name || "Unknown",
      track_icon: track?.icon || "",
      track_color: track?.color || "#6b7280",
      scoring_direction: direction,
      first_weight: startingWeight,
      latest_weight: latestWeight,
      weight_change_pct: startingWeight && latestWeight
        ? ((latestWeight - startingWeight) / startingWeight) * 100
        : 0,
      consistency_pct: consistencyPct,
      protein_adherence_pct: proteinAdherencePct,
      step_days_pct: stepDaysPct,
      score,
      rank: 0,
      total_checkins: pCheckins.length,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.rank = i + 1));

  return scored;
}

export function getStreak(checkinDates: string[]): number {
  if (checkinDates.length === 0) return 0;
  const sorted = [...new Set(checkinDates)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
