import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GeneratePlanButton from "./GeneratePlanButton";
import PaymentActions from "./PaymentActions";
import CoachNotes from "./CoachNotes";
import DashboardLink from "./DashboardLink";
import EditParticipant from "./EditParticipant";
import WelcomeEmail from "./WelcomeEmail";

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

  // Fetch challenge tracks and tiers
  const { data: challenge } = await supabase
    .from("challenges")
    .select("tracks(*), tiers(*)")
    .eq("id", participant.challenge_id)
    .single();

  const tracks = (challenge?.tracks ?? []) as { id: string; name: string }[];
  const tiers = (challenge?.tiers ?? []) as { id: string; name: string }[];

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

      {/* Edit Participant */}
      <EditParticipant
        participantId={participant.id}
        currentStatus={participant.status}
        currentTrackId={participant.track_id ?? null}
        currentTierId={participant.tier_id ?? null}
        currentPaymentStatus={participant.payment_status ?? "unpaid"}
        tracks={tracks}
        tiers={tiers}
      />

      {/* Generate Plan Button */}
      <div className="mb-8">
        <GeneratePlanButton
          participantId={participant.id}
          hasPlan={!!participant.ai_nutrition_plan}
        />
      </div>

      {/* Payment / Invoice */}
      <div className="mb-8">
        <PaymentActions
          participantId={participant.id}
          paymentStatus={participant.payment_status ?? null}
          invoiceAmountCents={participant.invoice_amount_cents ?? null}
        />
      </div>

      {/* Coach Notes */}
      <CoachNotes
        participantId={participant.id}
        initialNotes={participant.coach_notes ?? ""}
      />

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
            {participant.magic_link_token && (
              <div>
                <dt className="text-gray-500">Dashboard Link</dt>
                <dd>
                  <DashboardLink token={participant.magic_link_token} />
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
                    weightChange === 0
                      ? "text-gray-600"
                      : participant.tracks?.name === "Hard Gainer"
                      ? weightChange > 0
                        ? "text-green-600"
                        : "text-red-600"
                      : weightChange < 0
                      ? "text-green-600"
                      : "text-red-600"
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

      {/* Welcome Email */}
      {participant.magic_link_token && (participant.tracks as { name: string } | null)?.name && (participant.tiers as { name: string } | null)?.name && (
        <div className="mb-8">
          <WelcomeEmail
            participant={{
              name: participant.name,
              email: participant.email,
              magic_link_token: participant.magic_link_token,
            }}
            trackName={(participant.tracks as { name: string }).name}
            tierName={(participant.tiers as { name: string }).name}
          />
        </div>
      )}

      {/* Intake Data */}
      {intake && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Intake Data</h2>

          {/* Body Stats */}
          {(intake.weight != null || intake.goal_weight != null || intake.age != null || intake.sex != null || intake.height != null || intake.body_fat_percent != null) && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Body Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {intake.weight != null && (
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="text-gray-900 font-medium">{String(intake.weight)} lbs</p>
                  </div>
                )}
                {intake.goal_weight != null && (
                  <div>
                    <p className="text-gray-500">Goal Weight</p>
                    <p className="text-gray-900 font-medium">{String(intake.goal_weight)} lbs</p>
                  </div>
                )}
                {intake.age != null && (
                  <div>
                    <p className="text-gray-500">Age</p>
                    <p className="text-gray-900 font-medium">{String(intake.age)}</p>
                  </div>
                )}
                {intake.sex != null && (
                  <div>
                    <p className="text-gray-500">Sex</p>
                    <p className="text-gray-900 font-medium capitalize">{String(intake.sex)}</p>
                  </div>
                )}
                {intake.height != null && (
                  <div>
                    <p className="text-gray-500">Height</p>
                    <p className="text-gray-900 font-medium">{String(intake.height)}</p>
                  </div>
                )}
                {intake.body_fat_percent != null && (
                  <div>
                    <p className="text-gray-500">Body Fat %</p>
                    <p className="text-gray-900 font-medium">{String(intake.body_fat_percent)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Training */}
          {(intake.fitness_level != null || intake.activity_level != null || intake.training_days_per_week != null || intake.is_member != null) && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Training</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {intake.fitness_level != null && (
                  <div>
                    <p className="text-gray-500">Fitness Level</p>
                    <p className="text-gray-900 font-medium capitalize">{String(intake.fitness_level)}</p>
                  </div>
                )}
                {intake.activity_level != null && (
                  <div>
                    <p className="text-gray-500">Activity Level</p>
                    <p className="text-gray-900 font-medium capitalize">{String(intake.activity_level)}</p>
                  </div>
                )}
                {intake.training_days_per_week != null && (
                  <div>
                    <p className="text-gray-500">Training Days/Week</p>
                    <p className="text-gray-900 font-medium">{String(intake.training_days_per_week)}</p>
                  </div>
                )}
                {intake.is_member != null && (
                  <div>
                    <p className="text-gray-500">Gym Member</p>
                    <p className="text-gray-900 font-medium capitalize">{String(intake.is_member)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nutrition */}
          {(intake.dietary_restrictions != null || intake.cooking_skill != null || intake.meal_prep_available != null || intake.foods_they_love != null || intake.foods_they_hate != null) && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nutrition</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {intake.dietary_restrictions != null && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Dietary Restrictions</p>
                    <p className="text-gray-900 font-medium">{String(intake.dietary_restrictions)}</p>
                  </div>
                )}
                {intake.cooking_skill != null && (
                  <div>
                    <p className="text-gray-500">Cooking Skill</p>
                    <p className="text-gray-900 font-medium capitalize">{String(intake.cooking_skill)}</p>
                  </div>
                )}
                {intake.meal_prep_available != null && (
                  <div>
                    <p className="text-gray-500">Meal Prep Available</p>
                    <p className="text-gray-900 font-medium">{intake.meal_prep_available === true || intake.meal_prep_available === "true" ? "Yes" : "No"}</p>
                  </div>
                )}
                {intake.foods_they_love != null && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Foods They Love</p>
                    <p className="text-gray-900 font-medium">{String(intake.foods_they_love)}</p>
                  </div>
                )}
                {intake.foods_they_hate != null && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Foods They Hate</p>
                    <p className="text-gray-900 font-medium">{String(intake.foods_they_hate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Goals */}
          {intake.goals != null && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Goals</h3>
              <div className="text-sm">
                <p className="text-gray-500">Goals</p>
                <p className="text-gray-900 font-medium">{String(intake.goals)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Plans */}
      {participant.ai_nutrition_plan || participant.ai_training_plan ? (
        <>
          {participant.ai_nutrition_plan && (
            <details
              open
              className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 group"
            >
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors">
                AI Nutrition Plan
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">
                  {typeof participant.ai_nutrition_plan === "string"
                    ? participant.ai_nutrition_plan
                    : JSON.stringify(participant.ai_nutrition_plan, null, 2)}
                </div>
              </div>
            </details>
          )}

          {participant.ai_training_plan && (
            <details
              open
              className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 group"
            >
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors">
                AI Training Plan
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">
                  {typeof participant.ai_training_plan === "string"
                    ? participant.ai_training_plan
                    : JSON.stringify(participant.ai_training_plan, null, 2)}
                </div>
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 mb-8 text-center">
          <p className="text-gray-500 mb-4">
            No AI plan has been generated for this participant yet.
          </p>
          <GeneratePlanButton
            participantId={participant.id}
            hasPlan={false}
          />
        </div>
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
                    <td className="px-6 py-3">
                      {c.protein_hit != null ? (
                        <span
                          className={
                            c.protein_hit === "yes"
                              ? "text-green-600 font-medium"
                              : c.protein_hit === "close"
                              ? "text-yellow-600 font-medium"
                              : "text-red-500"
                          }
                        >
                          {c.protein_hit === "yes" ? "Hit" : c.protein_hit === "close" ? "Close" : "Missed"}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {c.trained != null ? (
                        <span
                          className={
                            c.trained === "yes"
                              ? "text-green-600 font-medium"
                              : c.trained === "rest_day"
                              ? "text-yellow-600 font-medium"
                              : "text-red-500"
                          }
                        >
                          {c.trained === "yes" ? "Yes" : c.trained === "rest_day" ? "Rest" : "No"}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.steps != null ? c.steps.toLocaleString() : "--"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {c.recovery_score != null ? `${c.recovery_score}/10` : "--"}
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
