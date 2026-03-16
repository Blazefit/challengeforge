import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GeneratePlanButton from "./GeneratePlanButton";
import PaymentActions from "./PaymentActions";
import CoachNotes from "./CoachNotes";
import DashboardLink from "./DashboardLink";
import EditParticipant from "./EditParticipant";
import AiReadiness from "./AiReadiness";
import WelcomeEmail from "./WelcomeEmail";
import AiActionButton from "./AiActionButton";
import SendPlanEmail from "./SendPlanEmail";

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

      {/* AI Plan Readiness */}
      <AiReadiness
        intake={participant.intake_pre as Record<string, unknown> | null}
        tierName={(participant.tiers as { name: string } | null)?.name ?? null}
        participantName={participant.name}
        participantEmail={participant.email}
        trackName={(participant.tracks as { name: string } | null)?.name ?? null}
        dashboardToken={participant.magic_link_token ?? null}
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
      {intake && (() => {
        const fmt = (val: unknown, suffix?: string): string => {
          if (val == null || val === "") return "";
          if (typeof val === "boolean") return val ? "Yes" : "No";
          if (val === "true") return "Yes";
          if (val === "false") return "No";
          return suffix ? `${String(val)}${suffix}` : String(val);
        };

        const categories = [
          {
            title: "Body Stats",
            fields: [
              { label: "Weight", value: fmt(intake.weight, " lbs") },
              { label: "Goal Weight", value: fmt(intake.goal_weight, " lbs") },
              { label: "Age", value: fmt(intake.age) },
              { label: "Sex", value: fmt(intake.sex ?? intake.gender) },
              { label: "Height", value: fmt(intake.height) },
              { label: "Body Fat %", value: fmt(intake.body_fat_pct ?? intake.body_fat_percent, "%") },
            ],
          },
          {
            title: "Training",
            fields: [
              { label: "Activity Level", value: fmt(intake.activity_level) },
              { label: "Fitness Level", value: fmt(intake.fitness_level) },
              { label: "Training Experience", value: fmt(intake.training_experience) },
              { label: "Training Days/Week", value: fmt(intake.training_days_per_week) },
              { label: "Gym Member", value: fmt(intake.is_member) },
              { label: "Injuries", value: fmt(intake.injuries) },
            ],
          },
          {
            title: "Nutrition",
            fields: [
              { label: "Current Diet", value: fmt(intake.current_diet) },
              { label: "Meals Per Day", value: fmt(intake.meals_per_day) },
              { label: "Dietary Restrictions", value: fmt(intake.dietary_restrictions) },
              { label: "Supplements", value: fmt(intake.supplements) },
              { label: "Cooking Skill", value: fmt(intake.cooking_skill) },
              { label: "Meal Prep Available", value: fmt(intake.meal_prep_available) },
              { label: "Foods They Love", value: fmt(intake.foods_they_love) },
              { label: "Foods They Hate", value: fmt(intake.foods_they_hate) },
            ],
          },
          {
            title: "Goals & Lifestyle",
            fields: [
              { label: "Primary Goal", value: fmt(intake.primary_goal ?? intake.goals) },
              { label: "Motivation", value: fmt(intake.motivation) },
              { label: "Sleep Hours", value: fmt(intake.sleep_hours) },
              { label: "Stress Level", value: fmt(intake.stress_level) },
            ],
          },
        ];

        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Intake Data</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <div key={cat.title}>
                  <div className="bg-gray-50 px-6 py-2.5 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {cat.title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-4 text-sm">
                    {cat.fields.map((f) => (
                      <div key={f.label} className="flex flex-col">
                        <dt className="text-gray-500 text-xs mb-0.5">{f.label}</dt>
                        {f.value ? (
                          <dd className="text-gray-900 font-medium capitalize">{f.value}</dd>
                        ) : (
                          <dd className="text-gray-300 font-medium">--</dd>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* AI Plans */}
      {participant.ai_nutrition_plan || participant.ai_training_plan ? (
        <>
          {participant.ai_nutrition_plan && (
            <details
              open
              className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 group"
            >
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                <span>AI Nutrition Plan</span>
                <SendPlanEmail
                  participantEmail={participant.email}
                  participantName={participant.name}
                  planTitle="Nutrition Plan"
                  planContent={typeof participant.ai_nutrition_plan === "string" ? participant.ai_nutrition_plan : ""}
                />
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
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                <span>AI Training Plan</span>
                <SendPlanEmail
                  participantEmail={participant.email}
                  participantName={participant.name}
                  planTitle="Training Plan"
                  planContent={typeof participant.ai_training_plan === "string" ? participant.ai_training_plan : ""}
                />
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

      {/* Additional AI Content */}
      {(() => {
        const tierName = (participant.tiers as { name: string } | null)?.name?.toLowerCase() ?? "";
        const isAccelOrElite = tierName === "the accelerator" || tierName === "the elite";
        const isElite = tierName === "the elite";

        return (
          <div className="space-y-6 mb-8">
            {/* Meal Plan - Elite only */}
            {isElite && (
              <details className="bg-white rounded-xl border border-gray-200 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                  <span>AI Meal Plan (Elite)</span>
                  <AiActionButton
                    participantId={participant.id}
                    endpoint="/api/ai/meal-plan"
                    label="Generate Meal Plan"
                    regenerateLabel="Regenerate"
                    hasContent={!!participant.ai_meal_plan}
                  />
                </summary>
                {participant.ai_meal_plan ? (
                  <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                    <div className="mb-3">
                      <SendPlanEmail participantEmail={participant.email} participantName={participant.name} planTitle="Custom Meal Plan" planContent={participant.ai_meal_plan} />
                    </div>
                    <div className="whitespace-pre-wrap">{participant.ai_meal_plan}</div>
                  </div>
                ) : (
                  <div className="px-6 pb-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
                    No meal plan generated yet. Click &quot;Generate Meal Plan&quot; above.
                  </div>
                )}
              </details>
            )}

            {/* Workout Modifications - Accelerator + Elite */}
            {isAccelOrElite && (
              <details className="bg-white rounded-xl border border-gray-200 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                  <span>AI Workout Modifications</span>
                  <AiActionButton
                    participantId={participant.id}
                    endpoint="/api/ai/workout-mod"
                    label="Generate Modifications"
                    regenerateLabel="Regenerate"
                    hasContent={!!participant.ai_workout_mod}
                  />
                </summary>
                {participant.ai_workout_mod ? (
                  <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                    <div className="mb-3">
                      <SendPlanEmail participantEmail={participant.email} participantName={participant.name} planTitle="Workout Modifications" planContent={participant.ai_workout_mod} />
                    </div>
                    <div className="whitespace-pre-wrap">{participant.ai_workout_mod}</div>
                  </div>
                ) : (
                  <div className="px-6 pb-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
                    No workout modifications generated yet.
                  </div>
                )}
              </details>
            )}

            {/* Weekly Analysis - Accelerator + Elite */}
            {isAccelOrElite && (
              <details className="bg-white rounded-xl border border-gray-200 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                  <span>AI Weekly Analysis</span>
                  <AiActionButton
                    participantId={participant.id}
                    endpoint="/api/ai/weekly-analysis"
                    label="Generate This Week"
                    regenerateLabel="Generate Next Week"
                    hasContent={!!participant.ai_weekly_analysis}
                  />
                </summary>
                {participant.ai_weekly_analysis ? (
                  <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                    <div className="mb-3">
                      <SendPlanEmail participantEmail={participant.email} participantName={participant.name} planTitle="Weekly Analysis" planContent={participant.ai_weekly_analysis} />
                    </div>
                    <div className="whitespace-pre-wrap">{participant.ai_weekly_analysis}</div>
                  </div>
                ) : (
                  <div className="px-6 pb-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
                    No weekly analysis generated yet.
                  </div>
                )}
              </details>
            )}

            {/* Mid-Program Adjustment - Accelerator + Elite */}
            {isAccelOrElite && (
              <details className="bg-white rounded-xl border border-gray-200 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                  <span>AI Mid-Program Adjustment (Week 4)</span>
                  <AiActionButton
                    participantId={participant.id}
                    endpoint="/api/ai/midprogram-adjustment"
                    label="Generate Adjustment"
                    regenerateLabel="Regenerate"
                    hasContent={!!participant.ai_midprogram_adjustment}
                  />
                </summary>
                {participant.ai_midprogram_adjustment ? (
                  <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                    <div className="mb-3">
                      <SendPlanEmail participantEmail={participant.email} participantName={participant.name} planTitle="Mid-Program Adjustment" planContent={participant.ai_midprogram_adjustment} />
                    </div>
                    <div className="whitespace-pre-wrap">{participant.ai_midprogram_adjustment}</div>
                  </div>
                ) : (
                  <div className="px-6 pb-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
                    No mid-program adjustment generated yet. Best generated at Week 4.
                  </div>
                )}
              </details>
            )}

            {/* Murph Prep - All tiers */}
            <details className="bg-white rounded-xl border border-gray-200 shadow-sm group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:text-red-600 transition-colors flex items-center justify-between">
                <span>Murph Prep Strategy</span>
                <AiActionButton
                  participantId={participant.id}
                  endpoint="/api/ai/murph-prep"
                  label="Generate Murph Prep"
                  regenerateLabel="Regenerate"
                  hasContent={!!participant.ai_murph_prep}
                />
              </summary>
              {participant.ai_murph_prep ? (
                <div className="px-6 pb-6 text-sm text-gray-700 border-t border-gray-100 pt-4 prose prose-sm max-w-none">
                  <div className="mb-3">
                    <SendPlanEmail participantEmail={participant.email} participantName={participant.name} planTitle="Murph Prep Strategy" planContent={participant.ai_murph_prep} />
                  </div>
                  <div className="whitespace-pre-wrap">{participant.ai_murph_prep}</div>
                </div>
              ) : (
                <div className="px-6 pb-6 text-sm text-gray-400 border-t border-gray-100 pt-4">
                  No Murph prep strategy generated yet. Best generated at Week 5-6.
                </div>
              )}
            </details>
          </div>
        );
      })()}

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
