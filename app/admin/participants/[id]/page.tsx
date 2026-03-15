import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ParticipantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  // Fetch participant with joins
  const { data: participant, error } = await supabase
    .from("participants")
    .select(
      "*, tracks(name, icon, color), tiers(name), challenges(name, start_date, end_date)"
    )
    .eq("id", id)
    .single();

  if (error || !participant) {
    redirect("/admin/participants");
  }

  // Fetch all checkins for this participant
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("participant_id", id)
    .order("date", { ascending: false });

  const allCheckins = checkins ?? [];

  // Compute weight data
  const intake =
    participant.intake_pre && typeof participant.intake_pre === "object"
      ? (participant.intake_pre as Record<string, unknown>)
      : null;

  const startingWeight = intake?.weight != null ? Number(intake.weight) : null;
  const checkinsSorted = [...allCheckins].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestCheckinWithWeight = [...allCheckins].find(
    (c) => c.weight != null
  );
  const currentWeight = latestCheckinWithWeight?.weight ?? null;
  const weightChange =
    startingWeight != null && currentWeight != null
      ? Math.round((currentWeight - startingWeight) * 10) / 10
      : null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/participants"
        className="inline-flex items-center text-sm text-gray-500 hover:text-red-600 mb-6"
      >
        &larr; Back to Participants
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {participant.name}
        </h1>
        {participant.tracks?.name && (
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: participant.tracks.color
                ? `${participant.tracks.color}20`
                : "#f3f4f6",
              color: participant.tracks.color ?? "#6b7280",
            }}
          >
            {participant.tracks.icon && (
              <span>{participant.tracks.icon}</span>
            )}
            {participant.tracks.name}
          </span>
        )}
        {participant.tiers?.name && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
            {participant.tiers.name}
          </span>
        )}
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            participant.status === "active"
              ? "bg-green-100 text-green-700"
              : participant.status === "dropped"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {participant.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Contact Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900 font-medium">
                {participant.email}
              </dd>
            </div>
            {participant.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900 font-medium">
                  {participant.phone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Weight Progression */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Weight Progression
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Starting
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {startingWeight != null ? `${startingWeight}` : "--"}
              </p>
              <p className="text-xs text-gray-400">lbs</p>
            </div>
            <div className="text-gray-300 text-2xl">&rarr;</div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Current
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentWeight != null ? `${currentWeight}` : "--"}
              </p>
              <p className="text-xs text-gray-400">lbs</p>
            </div>
            {weightChange != null && (
              <div className="ml-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Change
                </p>
                <p
                  className={`text-2xl font-bold ${
                    weightChange < 0
                      ? "text-green-600"
                      : weightChange > 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {weightChange > 0 ? "+" : ""}
                  {weightChange}
                </p>
                <p className="text-xs text-gray-400">lbs</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intake Data */}
      {intake && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Intake Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {intake.weight != null && (
              <div>
                <p className="text-gray-500">Weight</p>
                <p className="text-gray-900 font-medium">
                  {String(intake.weight)} lbs
                </p>
              </div>
            )}
            {intake.goal_weight != null && (
              <div>
                <p className="text-gray-500">Goal Weight</p>
                <p className="text-gray-900 font-medium">
                  {String(intake.goal_weight)} lbs
                </p>
              </div>
            )}
            {intake.fitness_level != null && (
              <div>
                <p className="text-gray-500">Fitness Level</p>
                <p className="text-gray-900 font-medium capitalize">
                  {String(intake.fitness_level)}
                </p>
              </div>
            )}
            {intake.goals != null && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-gray-500">Goals</p>
                <p className="text-gray-900 font-medium">
                  {String(intake.goals)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Plans */}
      {participant.ai_nutrition_plan && (
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 group">
          <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors">
            AI Nutrition Plan
          </summary>
          <div className="px-6 pb-6 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-4">
            {typeof participant.ai_nutrition_plan === "string"
              ? participant.ai_nutrition_plan
              : JSON.stringify(participant.ai_nutrition_plan, null, 2)}
          </div>
        </details>
      )}

      {participant.ai_training_plan && (
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 group">
          <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors">
            AI Training Plan
          </summary>
          <div className="px-6 pb-6 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-4">
            {typeof participant.ai_training_plan === "string"
              ? participant.ai_training_plan
              : JSON.stringify(participant.ai_training_plan, null, 2)}
          </div>
        </details>
      )}

      {/* Check-in History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Check-in History ({allCheckins.length})
          </h2>
        </div>
        {allCheckins.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            No check-ins recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Weight</th>
                  <th className="px-6 py-3">Protein</th>
                  <th className="px-6 py-3">Trained</th>
                  <th className="px-6 py-3">Steps</th>
                  <th className="px-6 py-3">Recovery</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allCheckins.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {c.date}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.weight != null ? `${c.weight} lbs` : "--"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.protein != null ? `${c.protein}g` : "--"}
                    </td>
                    <td className="px-6 py-3">
                      {c.trained != null ? (
                        <span
                          className={
                            c.trained
                              ? "text-green-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {c.trained ? "Yes" : "No"}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.steps != null ? c.steps.toLocaleString() : "--"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.recovery != null ? `${c.recovery}/10` : "--"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                      {c.notes ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
