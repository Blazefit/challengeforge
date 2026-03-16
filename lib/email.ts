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

const FROM_EMAIL = process.env.FROM_EMAIL || "ChallengeForge <noreply@challengeforge.vercel.app>";

interface WelcomeEmailParams {
  to: string;
  participantName: string;
  trackName: string;
  tierName: string;
  dashboardUrl: string;
  challengeName: string;
}

function getTrackContent(track: string) {
  const lower = track.toLowerCase();
  if (lower.includes("hard") || lower.includes("gain")) {
    return {
      focus: "building lean muscle and healthy weight gain",
      nutrition: "Your nutrition plan focuses on caloric surplus with clean, whole-food sources. Expect structured meal timing around your training to maximize muscle growth.",
      training: "Your training emphasizes progressive overload with compound lifts. We track your strength gains weekly alongside body composition.",
    };
  }
  if (lower.includes("last") || lower.includes("10")) {
    return {
      focus: "shedding those final stubborn pounds",
      nutrition: "Your nutrition plan is precision-calibrated for a moderate deficit, preserving muscle while targeting fat loss.",
      training: "Your training blends high-intensity intervals with strategic strength work to boost your metabolism.",
    };
  }
  return {
    focus: "a complete body composition transformation",
    nutrition: "Your nutrition plan is a comprehensive overhaul designed for sustainable change, building progressively as your body adapts.",
    training: "Your training ramps progressively over the challenge. We start with movement quality and build toward high-intensity work.",
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

  const subject = `Welcome to ${challengeName}, ${firstName}! Your ${trackName} journey starts now`;

  const body = `Hi ${firstName},

Welcome to ${challengeName}! You're signed up for the ${trackName} track on the ${tierName} tier, and we're excited to have you.

YOUR FOCUS
Your journey is all about ${t.focus}. Over the coming weeks, every workout, every meal, and every check-in is designed to move you closer to your goal.

NUTRITION
${t.nutrition}

TRAINING
${t.training}

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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${challengeName}!</h1>
    <p style="color: #fca5a5; margin: 8px 0 0;">You're in, ${firstName}.</p>
  </div>

  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
    <div style="display: inline-block; background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
      ${trackName} Track &middot; ${tierName}
    </div>

    <h2 style="color: #111; font-size: 18px; margin: 20px 0 8px;">Your Focus</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">${t.focus.charAt(0).toUpperCase() + t.focus.slice(1)}. Every workout, every meal, and every check-in is designed to move you closer to your goal.</p>

    <h2 style="color: #111; font-size: 18px; margin: 20px 0 8px;">Nutrition</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">${t.nutrition}</p>

    <h2 style="color: #111; font-size: 18px; margin: 20px 0 8px;">Training</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">${t.training}</p>

    <h2 style="color: #111; font-size: 18px; margin: 20px 0 8px;">Your ${tierName} Tier Includes</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">${r.features.charAt(0).toUpperCase() + r.features.slice(1)}.</p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">${r.support}</p>

    <h2 style="color: #111; font-size: 18px; margin: 20px 0 12px;">Getting Started</h2>
    <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
      <li>Complete your intake form on your dashboard</li>
      <li>Log your starting weight before the challenge begins</li>
      <li>Check in daily once the challenge starts</li>
    </ol>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Go to My Dashboard</a>
    </div>

    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
      Let's make this count.<br>— The CrossFit Blaze Team
    </p>
  </div>
</div>`;

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text: body,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

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
