import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoachCheckins() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  // Get gym for this user
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) {
    redirect("/admin/onboarding");
  }

  // Get the first challenge for this gym
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Check-Ins</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400 mb-4">
            No challenge found. Create a challenge first.
          </p>
          <Link
            href="/admin/challenges/new"
            className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Create Challenge
          </Link>
        </div>
      </div>
    );
  }

  const challengeId = challenge.id;

  // All active participants
  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, email, tracks(name, icon, color)")
    .eq("challenge_id", challengeId)
    .eq("status", "active");

  const activeParticipants = participants ?? [];

  // Today's checkins (Eastern Time)
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*, participants(name, email, tracks(name, icon, color))")
    .eq("date", today);

  const todayCheckins = checkins ?? [];

  // Compute missing participants
  const checkedInIds = new Set(todayCheckins.map((c) => c.participant_id));
  const missingParticipants = activeParticipants.filter(
    (p) => !checkedInIds.has(p.id)
  );

  const checkedInCount = checkedInIds.size;
  const missingCount = missingParticipants.length;
  const totalActive = activeParticipants.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check-Ins</h1>
        <span className="text-sm text-gray-500">{today}</span>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Checked In</p>
          <p className="text-3xl font-bold text-green-600">{checkedInCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Missing</p>
          <p className="text-3xl font-bold text-red-600">{missingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Total Active</p>
          <p className="text-3xl font-bold text-gray-900">{totalActive}</p>
        </div>
      </div>

      {/* Today's Check-ins */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Today&apos;s Check-ins
          </h2>
        </div>

        {todayCheckins.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400">No check-ins submitted today yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Track</th>
                  <th className="px-6 py-3 font-medium">Weight</th>
                  <th className="px-6 py-3 font-medium">Protein</th>
                  <th className="px-6 py-3 font-medium">Trained</th>
                  <th className="px-6 py-3 font-medium">Steps</th>
                  <th className="px-6 py-3 font-medium">Recovery</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayCheckins.map((c) => {
                  const p = c.participants as {
                    name: string;
                    email: string;
                    tracks: { name: string; icon: string; color: string } | null;
                  } | null;
                  const track = p?.tracks;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {p?.name ?? "Unknown"}
                      </td>
                      <td className="px-6 py-3">
                        {track ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${track.color}20`,
                              color: track.color,
                            }}
                          >
                            {track.icon} {track.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {c.weight != null ? `${c.weight} lbs` : "--"}
                      </td>
                      <td className="px-6 py-3">
                        <ProteinBadge value={c.protein_hit} />
                      </td>
                      <td className="px-6 py-3">
                        <TrainedBadge value={c.trained} />
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {c.steps != null
                          ? c.steps.toLocaleString()
                          : "--"}
                      </td>
                      <td className="px-6 py-3">
                        <RecoveryBadge value={c.recovery} />
                      </td>
                      <td className="px-6 py-3 text-gray-500 max-w-[200px] truncate">
                        {c.notes || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missing Today */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Missing Today</h2>
        </div>

        {missingParticipants.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-green-600 font-medium">
              Everyone has checked in today!
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {missingParticipants.map((p) => {
                const track = (Array.isArray(p.tracks) ? p.tracks[0] : p.tracks) as {
                  name: string;
                  icon: string;
                  color: string;
                } | null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {p.name}
                    </span>
                    {track && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${track.color}20`,
                          color: track.color,
                        }}
                      >
                        {track.icon} {track.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProteinBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">--</span>;
  const config: Record<string, { label: string; className: string }> = {
    yes: { label: "Yes", className: "bg-green-100 text-green-700" },
    close: { label: "Close", className: "bg-yellow-100 text-yellow-700" },
    no: { label: "No", className: "bg-red-100 text-red-700" },
  };
  const c = config[value] ?? { label: value, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function TrainedBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">--</span>;
  const config: Record<string, { label: string; className: string }> = {
    yes: { label: "Yes", className: "bg-green-100 text-green-700" },
    rest: { label: "Rest Day", className: "bg-yellow-100 text-yellow-700" },
    no: { label: "No", className: "bg-red-100 text-red-700" },
  };
  const c = config[value] ?? { label: value, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function RecoveryBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">--</span>;
  let className = "bg-red-100 text-red-700";
  if (value >= 7) className = "bg-green-100 text-green-700";
  else if (value >= 4) className = "bg-yellow-100 text-yellow-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {value}/10
    </span>
  );
}
