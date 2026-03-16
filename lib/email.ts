import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

// Once crossfitblaze.com DNS records are verified in Resend, update this:
const FROM_EMAIL = process.env.FROM_EMAIL || "ChallengeForge <onboarding@resend.dev>";
const ADMIN_EMAIL = "jason@crossfitblaze.com";

// ── Generic send helper ─────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
      replyTo: replyTo || ADMIN_EMAIL,
    });
    if (error) {
      console.error("[Email] Send failed:", error);
      return { success: false, error };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Exception:", err);
    return { success: false, error: err };
  }
}

// ── Track / Tier content helpers ────────────────────────────────────────────

function getTrackContent(track: string) {
  const lower = track.toLowerCase();
  if (lower.includes("hard") || lower.includes("gain")) {
    return {
      emoji: "💪",
      focus: "building lean muscle and healthy weight gain",
      nutrition: "Your nutrition plan focuses on caloric surplus with clean, whole-food sources. Expect structured meal timing around your training to maximize muscle growth.",
      training: "Your training emphasizes progressive overload with compound lifts. We track your strength gains weekly alongside body composition.",
      tip: "Start tracking your meals now — hitting your caloric surplus is the #1 key to your success.",
    };
  }
  if (lower.includes("last") || lower.includes("10")) {
    return {
      emoji: "🔥",
      focus: "shedding those final stubborn pounds",
      nutrition: "Your nutrition plan is precision-calibrated for a moderate deficit, preserving muscle while targeting fat loss.",
      training: "Your training blends high-intensity intervals with strategic strength work to boost your metabolism.",
      tip: "Start hitting 10K steps daily NOW. It makes a massive difference once the challenge starts.",
    };
  }
  return {
    emoji: "⚡",
    focus: "a complete body composition transformation",
    nutrition: "Your nutrition plan is a comprehensive overhaul designed for sustainable change, building progressively as your body adapts.",
    training: "Your training ramps progressively over the challenge. We start with movement quality and build toward high-intensity work.",
    tip: "Focus on building habits this week — consistent daily check-ins are what separate transformers from talkers.",
  };
}

function getTierContent(tier: string) {
  const lower = tier.toLowerCase();
  if (lower.includes("elite")) {
    return {
      features: "the full VIP experience: daily AI coaching feedback, custom meal plans, personalized training modifications, and priority support",
      support: "Your coach reviews every single check-in and you get personalized AI coaching after each submission.",
    };
  }
  if (lower.includes("accelerator")) {
    return {
      features: "everything in The Plan plus weekly coaching analysis, custom macro adjustments, and workout modifications",
      support: "You'll receive a weekly AI analysis every Monday and personalized workout modifications.",
    };
  }
  return {
    features: "daily check-ins, access to the leaderboard, and your personalized nutrition and training plan",
    support: "Track your progress on your personal dashboard and see how you stack up on the leaderboard.",
  };
}

// ── Welcome Email (participant confirmation) ────────────────────────────────

interface WelcomeEmailParams {
  to: string;
  participantName: string;
  trackName: string;
  tierName: string;
  dashboardUrl: string;
  challengeName: string;
}

export async function sendWelcomeEmail({
  to,
  participantName,
  trackName,
  tierName,
  dashboardUrl,
  challengeName,
}: WelcomeEmailParams) {
  const firstName = participantName.split(" ")[0];
  const t = getTrackContent(trackName);
  const r = getTierContent(tierName);

  const subject = `You're in, ${firstName}! ${challengeName} — ${trackName} Track ${t.emoji}`;

  const text = `Hi ${firstName},

Welcome to ${challengeName}! You're signed up for the ${trackName} track on the ${tierName} tier, and we're excited to have you.

YOUR FOCUS
Your journey is all about ${t.focus}. Every workout, every meal, and every check-in is designed to move you closer to your goal.

NUTRITION
${t.nutrition}

TRAINING
${t.training}

PRO TIP: ${t.tip}

YOUR ${tierName.toUpperCase()} TIER INCLUDES
As a ${tierName} member, you get ${r.features}.
${r.support}

GETTING STARTED
1. Complete your intake form on your dashboard
2. Log your starting weight before the challenge begins
3. Check in daily once the challenge starts

YOUR PERSONAL DASHBOARD
Bookmark this link — it's your personal access to the challenge:
${dashboardUrl}

Let's make this count.
- The CrossFit Blaze Team`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background-color:#111827;border-radius:12px;overflow:hidden;">
      <div style="padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;font-size:24px;margin:0;">Welcome to ${challengeName} ${t.emoji}</h1>
        <p style="color:#9ca3af;font-size:14px;margin:8px 0 0;">CrossFit Blaze &bull; ${trackName} Track &bull; ${tierName}</p>
      </div>
      <div style="background-color:#1f2937;padding:24px;border-radius:0 0 12px 12px;">
        <p style="color:#e5e7eb;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
        <p style="color:#e5e7eb;font-size:16px;line-height:1.6;">You're officially signed up! Your journey is all about <strong style="color:#ffffff;">${t.focus}</strong>.</p>
        <h3 style="color:#f59e0b;font-size:14px;margin:20px 0 8px;">NUTRITION</h3>
        <p style="color:#d1d5db;font-size:14px;line-height:1.5;">${t.nutrition}</p>
        <h3 style="color:#f59e0b;font-size:14px;margin:20px 0 8px;">TRAINING</h3>
        <p style="color:#d1d5db;font-size:14px;line-height:1.5;">${t.training}</p>
        <div style="background-color:#374151;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="color:#ef4444;font-weight:bold;margin:0 0 8px;font-size:14px;">PRO TIP:</p>
          <p style="color:#d1d5db;margin:0;font-size:14px;line-height:1.5;">${t.tip}</p>
        </div>
        <div style="background-color:#374151;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;font-size:14px;">YOUR ${tierName.toUpperCase()} TIER INCLUDES:</p>
          <p style="color:#d1d5db;margin:0;font-size:14px;line-height:1.5;">${r.features.charAt(0).toUpperCase() + r.features.slice(1)}.</p>
          <p style="color:#d1d5db;margin:8px 0 0;font-size:14px;line-height:1.5;">${r.support}</p>
        </div>
        <p style="color:#e5e7eb;font-size:16px;line-height:1.6;font-weight:bold;">Next Steps:</p>
        <ol style="color:#d1d5db;font-size:14px;line-height:1.8;padding-left:20px;">
          <li>Complete your intake form on your dashboard</li>
          <li>Log your starting weight before the challenge begins</li>
          <li>Check in daily once the challenge starts</li>
        </ol>
        <div style="text-align:center;margin:24px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">Open My Dashboard</a>
        </div>
        <p style="color:#6b7280;font-size:12px;text-align:center;margin:16px 0 0;">Bookmark this link — it's your personal dashboard:<br>
        <a href="${dashboardUrl}" style="color:#9ca3af;">${dashboardUrl}</a></p>
        <hr style="border:none;border-top:1px solid #374151;margin:24px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">CrossFit Blaze &bull; Naples, FL<br>Questions? Reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject, html, text });
}

// ── Admin Notification Email ────────────────────────────────────────────────

interface AdminNotificationParams {
  participantName: string;
  email: string;
  phone?: string;
  trackName: string;
  tierName: string;
  tierPrice: string;
  weight?: number;
  goalWeight?: number;
  adminUrl: string;
  paymentStatus: string;
}

export async function sendAdminSignupNotification(params: AdminNotificationParams) {
  const subject = `New Signup: ${params.participantName} — ${params.trackName} / ${params.tierName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background-color:#fef2f2;">
        <h2 style="margin:0;color:#111827;font-size:18px;">New Challenge Signup</h2>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;width:120px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${params.participantName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${params.email}" style="color:#dc2626;">${params.email}</a></td></tr>
          ${params.phone ? `<tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;"><a href="tel:${params.phone}" style="color:#dc2626;">${params.phone}</a></td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#6b7280;">Track</td><td style="padding:8px 0;color:#111827;font-weight:600;">${params.trackName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Tier</td><td style="padding:8px 0;color:#111827;font-weight:600;">${params.tierName} (${params.tierPrice})</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Payment</td><td style="padding:8px 0;"><span style="background-color:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${params.paymentStatus.toUpperCase()}</span></td></tr>
          ${params.weight ? `<tr><td style="padding:8px 0;color:#6b7280;">Starting Weight</td><td style="padding:8px 0;color:#111827;">${params.weight} lbs</td></tr>` : ""}
          ${params.goalWeight ? `<tr><td style="padding:8px 0;color:#6b7280;">Goal Weight</td><td style="padding:8px 0;color:#111827;">${params.goalWeight} lbs</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;text-align:center;">
          <a href="${params.adminUrl}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:bold;font-size:14px;">View Participant</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

// ── Broadcast Email ─────────────────────────────────────────────────────────

interface BroadcastEmailParams {
  to: string[];
  subject: string;
  body: string;
}

export async function sendBroadcastEmail({ to, subject, body }: BroadcastEmailParams) {
  try {
    const { data, error } = await getResend().batch.send(
      to.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject,
        text: body,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">ChallengeForge</h1>
          </div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
            <div style="color: #374151; line-height: 1.7; white-space: pre-wrap;">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>
        </div>`,
      }))
    );

    if (error) {
      console.error("Resend batch error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Broadcast send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
