"use client";

import { useState, useMemo } from "react";

interface Challenge {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface Track {
  id: string;
  name: string;
  color: string;
  challenge_id: string;
}

interface Tier {
  id: string;
  name: string;
  price_cents: number;
  challenge_id: string;
}

interface Participant {
  id: string;
  challenge_id: string;
  track_id: string;
  tier_id: string;
  name: string;
  email: string;
  phone: string | null;
  intake_pre: Record<string, unknown>;
  intake_post: Record<string, unknown> | null;
  starting_photos: string[] | null;
  final_photos: string[] | null;
  ai_nutrition_plan: string | null;
  ai_training_plan: string | null;
  ai_meal_plan: string | null;
  ai_generated_at: string | null;
  status: string;
  magic_link_token: string;
  profile_completed: boolean;
  created_at: string;
}

export default function ParticipantsTable({
  challenges,
  tracks,
  tiers,
  participants,
}: {
  challenges: Challenge[];
  tracks: Track[];
  tiers: Tier[];
  participants: Participant[];
}) {
  const [search, setSearch] = useState("");
  const [challengeFilter, setChallengeFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const trackMap = useMemo(() => {
    const m: Record<string, Track> = {};
    for (const t of tracks) m[t.id] = t;
    return m;
  }, [tracks]);

  const tierMap = useMemo(() => {
    const m: Record<string, Tier> = {};
    for (const t of tiers) m[t.id] = t;
    return m;
  }, [tiers]);

  const challengeMap = useMemo(() => {
    const m: Record<string, Challenge> = {};
    for (const c of challenges) m[c.id] = c;
    return m;
  }, [challenges]);

  // Filter tracks/tiers based on selected challenge
  const availableTracks = useMemo(() => {
    if (challengeFilter === "all") return tracks;
    return tracks.filter((t) => t.challenge_id === challengeFilter);
  }, [tracks, challengeFilter]);

  const availableTiers = useMemo(() => {
    if (challengeFilter === "all") return tiers;
    return tiers.filter((t) => t.challenge_id === challengeFilter);
  }, [tiers, challengeFilter]);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (challengeFilter !== "all" && p.challenge_id !== challengeFilter)
        return false;
      if (trackFilter !== "all" && p.track_id !== trackFilter) return false;
      if (tierFilter !== "all" && p.tier_id !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.email.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [participants, challengeFilter, trackFilter, tierFilter, search]);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} of {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        {challenges.length > 1 && (
          <select
            value={challengeFilter}
            onChange={(e) => {
              setChallengeFilter(e.target.value);
              setTrackFilter("all");
              setTierFilter("all");
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Challenges</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Tracks</option>
          {availableTracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Tiers</option>
          {availableTiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            {participants.length === 0 ? (
              <>
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500 font-medium mb-1">
                  No participants yet.
                </p>
                <p className="text-gray-400 text-sm">
                  Share your challenge signup link to get started!
                </p>
              </>
            ) : (
              <p className="text-gray-400">
                No participants match your filters.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Track
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Weight
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Goal
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    Profile
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const track = trackMap[p.track_id];
                  const tier = tierMap[p.tier_id];
                  const isExpanded = expandedId === p.id;
                  const weight = p.intake_pre?.weight;
                  const goalWeight = p.intake_pre?.goal_weight;

                  return (
                    <ParticipantRow
                      key={p.id}
                      participant={p}
                      track={track}
                      tier={tier}
                      challenge={challengeMap[p.challenge_id]}
                      weight={weight}
                      goalWeight={goalWeight}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedId(isExpanded ? null : p.id)
                      }
                      formatDate={formatDate}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant: p,
  track,
  tier,
  challenge,
  weight,
  goalWeight,
  isExpanded,
  onToggle,
  formatDate,
}: {
  participant: Participant;
  track: Track | undefined;
  tier: Tier | undefined;
  challenge: Challenge | undefined;
  weight: unknown;
  goalWeight: unknown;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
}) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
        <td className="px-4 py-3 text-gray-600">{p.email}</td>
        <td className="px-4 py-3">
          {track ? (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: track.color || "#6b7280" }}
            >
              {track.name}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-700">{tier?.name ?? "-"}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              p.status === "active"
                ? "bg-green-100 text-green-700"
                : p.status === "completed"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {p.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
          {weight != null ? `${weight} lbs` : "-"}
        </td>
        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
          {goalWeight != null ? `${goalWeight} lbs` : "-"}
        </td>
        <td className="px-4 py-3 text-center">
          {p.profile_completed ? (
            <span className="text-green-600 font-medium">Yes</span>
          ) : (
            <span className="text-gray-400">No</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 text-xs">
          {formatDate(p.created_at)}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-gray-50 px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Pre-intake data */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  Pre-Payment Intake
                </h4>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm space-y-1">
                  {p.intake_pre && typeof p.intake_pre === "object" ? (
                    Object.entries(
                      p.intake_pre as Record<string, unknown>
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500 capitalize">
                          {k.replace(/_/g, " ")}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {String(v)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No pre-intake data</p>
                  )}
                </div>
              </div>

              {/* Column 2: Post-intake data */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  Post-Payment Profile
                </h4>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm space-y-1">
                  {p.intake_post && typeof p.intake_post === "object" ? (
                    Object.entries(
                      p.intake_post as Record<string, unknown>
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-gray-500 capitalize shrink-0">
                          {k.replace(/_/g, " ")}
                        </span>
                        <span className="text-gray-900 font-medium text-right">
                          {String(v)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">
                      Profile not yet completed
                    </p>
                  )}
                </div>
              </div>

              {/* Column 3: AI Plan + Meta */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    AI Plan Status
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
                    {p.ai_generated_at ? (
                      <span className="text-green-600 font-medium">
                        Generated on{" "}
                        {formatDate(p.ai_generated_at)}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    Details
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm space-y-1">
                    {challenge && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Challenge</span>
                        <span className="text-gray-900 font-medium">
                          {challenge.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Magic Link</span>
                      <span className="text-gray-600 text-xs font-mono truncate max-w-[160px]">
                        /me/{p.magic_link_token}
                      </span>
                    </div>
                    {p.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone</span>
                        <span className="text-gray-900">{p.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {p.starting_photos &&
                  Array.isArray(p.starting_photos) &&
                  p.starting_photos.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                        Starting Photos
                      </h4>
                      <div className="flex gap-2">
                        {(p.starting_photos as string[]).map(
                          (url: string, i: number) => (
                            <div
                              key={i}
                              className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-500 overflow-hidden"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Photo ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Re-declare interfaces at module scope so ParticipantRow can use them
interface Participant {
  id: string;
  challenge_id: string;
  track_id: string;
  tier_id: string;
  name: string;
  email: string;
  phone: string | null;
  intake_pre: Record<string, unknown>;
  intake_post: Record<string, unknown> | null;
  starting_photos: string[] | null;
  final_photos: string[] | null;
  ai_nutrition_plan: string | null;
  ai_training_plan: string | null;
  ai_meal_plan: string | null;
  ai_generated_at: string | null;
  status: string;
  magic_link_token: string;
  profile_completed: boolean;
  created_at: string;
}
