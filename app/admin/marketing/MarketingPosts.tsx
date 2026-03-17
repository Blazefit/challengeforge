"use client";

import { useState, useMemo } from "react";

interface Track {
  id: string;
  name: string;
  description: string | null;
}

interface Tier {
  id: string;
  name: string;
  price_cents: number;
}

interface Challenge {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  status: string;
  early_bird_ends: string | null;
  tracks: Track[];
  tiers: Tier[];
}

type PostStatus = "draft" | "scheduled" | "posted";

interface PostData {
  number: number;
  phase: "pre-launch" | "during" | "post";
  suggestedDate: string;
  title: string;
  caption: string;
  hashtags: string;
  imagePrompt: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function generatePosts(challenge: Challenge, gymName: string): PostData[] {
  const { name, start_date, end_date, early_bird_ends } = challenge;
  const tracks = challenge.tracks;
  const tiers = challenge.tiers.sort((a, b) => a.price_cents - b.price_cents);

  const earlyBird = early_bird_ends ?? addDays(start_date, -7);
  const trackNames = tracks.map((t) => t.name);
  const hardGainer = trackNames.find((n) => n.toLowerCase().includes("hard")) ?? trackNames[0] ?? "Hard Gainer";
  const lastTen = trackNames.find((n) => n.toLowerCase().includes("last") || n.toLowerCase().includes("10")) ?? trackNames[1] ?? "Last 10";
  const transformer = trackNames.find((n) => n.toLowerCase().includes("transform")) ?? trackNames[2] ?? "Transformer";

  const tierInfo = tiers.length >= 3
    ? `${tiers[0].name} ($${tiers[0].price_cents / 100}), ${tiers[1].name} ($${tiers[1].price_cents / 100}), and ${tiers[2].name} ($${tiers[2].price_cents / 100})`
    : tiers.map((t) => `${t.name} ($${t.price_cents / 100})`).join(", ") || "multiple tiers available";

  const posts: PostData[] = [
    // PRE-LAUNCH
    {
      number: 1,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -28),
      title: "Teaser / Announcement",
      caption: `Something BIG is coming to ${gymName}. The ${name} is about to drop and it's going to change everything. 8 weeks. 3 tracks. Multiple tiers. One goal: YOUR best transformation yet. Stay tuned for the full reveal.`,
      hashtags: "#FitnessChallenge #TransformationSeason #GymLife #FitnessGoals #ChallengeAccepted #NewChallenge",
      imagePrompt: `Dramatic gym scene with moody lighting, a barbell on the floor with chalk dust in the air, text overlay space for "${name}" announcement. Dark background with red accent lighting. Fitness motivation aesthetic.`,
    },
    {
      number: 2,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -24),
      title: `Track Reveal - ${hardGainer}`,
      caption: `Track reveal #1: ${hardGainer}. This track is built for athletes who want to put on lean muscle and size. If you've been grinding but can't seem to pack on the gains, this is YOUR track. Custom nutrition targets, strength-focused programming cues, and a community that gets it. The ${name} starts ${formatDate(start_date)}.`,
      hashtags: "#HardGainer #MuscleBuilding #BulkSeason #StrengthTraining #FitnessChallenge #GainsOnGains",
      imagePrompt: `Powerful athlete performing a heavy deadlift in a CrossFit gym, muscles engaged, chalk on hands, dramatic side lighting. Bold text space for "${hardGainer}" track name. High contrast, motivational fitness photography.`,
    },
    {
      number: 3,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -21),
      title: `Track Reveal - ${lastTen}`,
      caption: `Track reveal #2: ${lastTen}. You've done the work. You've come so far. But those last stubborn pounds won't budge. This track is precision-tuned for athletes who are CLOSE and need that final push. Dialed-in nutrition, accountability, and the structure to finally break through. ${name} starts ${formatDate(start_date)}.`,
      hashtags: "#Last10Pounds #WeightLoss #FitnessJourney #BodyComposition #LeanOut #FinalPush",
      imagePrompt: `Fit athlete doing box jumps in a bright CrossFit gym, mid-air action shot, determination on their face. Clean, bright aesthetic with space for "${lastTen}" text overlay. Energetic and aspirational.`,
    },
    {
      number: 4,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -18),
      title: `Track Reveal - ${transformer}`,
      caption: `Track reveal #3: ${transformer}. This is the big one. If you're ready to completely overhaul your fitness, nutrition, and mindset, the ${transformer} track is calling your name. This isn't a tweak -- it's a total reinvention. 8 weeks to become the version of yourself you've been dreaming about. ${name} kicks off ${formatDate(start_date)}.`,
      hashtags: "#BodyTransformation #FitnessTransformation #NewYouLoading #TotalOverhaul #FitnessChallenge #GameChanger",
      imagePrompt: `Before/after style split image concept in a gym setting, one side darker and one side bright and energetic. Space for "${transformer}" text. Inspirational transformation theme with CrossFit equipment visible.`,
    },
    {
      number: 5,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -14),
      title: "Tier Breakdown (Pricing)",
      caption: `Let's talk tiers. The ${name} has something for every level of commitment: ${tierInfo}. Every tier gets you in the challenge. Higher tiers unlock more coaching, more accountability, and more support. Which tier matches YOUR goals? Link in bio to sign up.`,
      hashtags: "#InvestInYourself #FitnessInvestment #WorthIt #ChallengeSignUp #FitnessChallenge #LevelUp",
      imagePrompt: `Clean, modern infographic-style gym photo with three distinct levels/sections, each progressively more premium. Bright gym background with overlay space for pricing tiers. Professional fitness branding aesthetic.`,
    },
    {
      number: 6,
      phase: "pre-launch",
      suggestedDate: addDays(earlyBird, -3),
      title: "Early Bird Deadline Reminder",
      caption: `Early bird pricing ends ${formatDate(earlyBird)}! If you've been on the fence about the ${name}, NOW is the time to lock in your spot at the best price. Once the deadline passes, prices go up. Don't let procrastination cost you. Sign up today -- link in bio.`,
      hashtags: "#EarlyBird #LimitedTime #ActNow #FitnessChallenge #DontWait #SignUpNow",
      imagePrompt: `Urgent, high-energy gym scene with a countdown/clock element. Athlete in motion with dynamic lighting. Bold red accent colors suggesting urgency. Space for "Early Bird Ends Soon" text overlay.`,
    },
    {
      number: 7,
      phase: "pre-launch",
      suggestedDate: addDays(start_date, -3),
      title: "Last Chance to Sign Up",
      caption: `FINAL CALL. The ${name} starts ${formatDate(start_date)} and spots are filling up fast. 8 weeks of structure, accountability, and results. 3 tracks. 3 tiers. Zero excuses. This is your moment. Are you in or are you watching from the sidelines? Sign up now -- link in bio.`,
      hashtags: "#LastChance #NoExcuses #ChallengeAccepted #FitnessChallenge #NowOrNever #JoinUs",
      imagePrompt: `Intense group fitness scene in a CrossFit box, athletes mid-workout, sweat and determination visible. Dramatic lighting with "Last Chance" urgency feel. Community energy and intensity.`,
    },

    // DURING CHALLENGE
    {
      number: 8,
      phase: "during",
      suggestedDate: start_date,
      title: "Week 1 Kickoff",
      caption: `IT'S GO TIME. Week 1 of the ${name} is officially underway at ${gymName}! Our challengers showed up, locked in, and are already putting in the work. The energy in this gym is ELECTRIC. 8 weeks starts now. Let's get after it!`,
      hashtags: "#Week1 #ChallengeKickoff #LetsGo #FitnessChallenge #DayOne #GameOn",
      imagePrompt: `Energetic group photo in a CrossFit gym, athletes fist-bumping or cheering, first day energy. Bright lighting, community vibes, visible excitement. Space for "Week 1" text overlay.`,
    },
    {
      number: 9,
      phase: "during",
      suggestedDate: addDays(start_date, 7),
      title: "Week 2 Momentum",
      caption: `Week 2 and the momentum is BUILDING. Our ${name} athletes are settling into their nutrition plans, hitting their workouts, and showing up for each other. The hardest part is starting -- and they already crushed that. Now it's about consistency. Keep stacking those days.`,
      hashtags: "#Week2 #Momentum #Consistency #FitnessChallenge #KeepGoing #StackTheDays",
      imagePrompt: `Athlete in focused training mode, perhaps doing a clean or snatch, mid-lift with perfect form. Gym background slightly blurred, emphasis on determination. Week 2 progression feel.`,
    },
    {
      number: 10,
      phase: "during",
      suggestedDate: addDays(start_date, 14),
      title: "Week 3 - Halfway Check",
      caption: `THREE WEEKS IN. This is where the magic starts happening. Bodies are adapting, habits are forming, and our ${name} challengers are starting to SEE the changes. Clothes fit different. Energy is up. Confidence is through the roof. If you're in the challenge: trust the process. It's working.`,
      hashtags: "#Week3 #TrustTheProcess #ResultsIncoming #FitnessChallenge #HalfwayThere #ProgressNotPerfection",
      imagePrompt: `Close-up of an athlete checking progress, maybe looking at a workout log or standing confidently post-workout. Natural gym lighting, authentic moment. Subtle progress/transformation theme.`,
    },
    {
      number: 11,
      phase: "during",
      suggestedDate: addDays(start_date, 21),
      title: "Week 4 - Midpoint Celebration",
      caption: `MIDPOINT! 4 weeks down, 4 to go. Our ${name} crew is absolutely CRUSHING it. We're celebrating the halfway mark because showing up for 4 straight weeks is no joke. The discipline you've built so far? That's yours forever. Now let's finish what we started. Second half energy: ACTIVATED.`,
      hashtags: "#Halfway #Midpoint #4WeeksDown #FitnessChallenge #Discipline #SecondHalf",
      imagePrompt: `Celebration moment in the gym -- athletes high-fiving or group huddle, big smiles. Midpoint banner or visual element. Warm, community-focused lighting. Celebratory but still gritty gym atmosphere.`,
    },
    {
      number: 12,
      phase: "during",
      suggestedDate: addDays(start_date, 28),
      title: "Week 5 - Keep Pushing",
      caption: `Week 5 check-in: this is where champions are made. The novelty has worn off. The excitement of week 1 is a memory. But the ${name} athletes at ${gymName}? They're STILL HERE. Still grinding. Still showing up. This is the difference between wanting change and EARNING it. Keep pushing.`,
      hashtags: "#Week5 #GrindMode #EarnIt #FitnessChallenge #MentalToughness #KeepPushing",
      imagePrompt: `Gritty, raw gym moment -- athlete grinding through a tough workout, visible effort and sweat. Darker, more intense lighting. Emphasize perseverance and grit. Real, unpolished fitness moment.`,
    },
    {
      number: 13,
      phase: "during",
      suggestedDate: addDays(start_date, 35),
      title: "Week 6 - Final Stretch Begins",
      caption: `The final stretch begins NOW. 2 weeks left in the ${name} and our athletes can see the finish line. This is where you dig DEEP. Every meal matters. Every workout counts. Every hour of sleep adds up. You didn't come this far to only come this far. FINISH STRONG.`,
      hashtags: "#FinalStretch #2WeeksLeft #FinishStrong #FitnessChallenge #AllIn #NoLetUp",
      imagePrompt: `Athlete in an intense finishing push, maybe on a rower or doing wall balls, face showing pure determination. Dramatic lighting with a "light at the end of the tunnel" feel. Finish line energy.`,
    },
    {
      number: 14,
      phase: "during",
      suggestedDate: addDays(start_date, 42),
      title: "Week 7 - One Week Left",
      caption: `ONE. WEEK. LEFT. 7 days until the ${name} wraps up and our challengers can look back at 8 weeks of INCREDIBLE work. The transformations we're seeing are unreal -- but more importantly, the HABITS that have been built will last a lifetime. Give this last week everything you've got. Leave nothing on the table.`,
      hashtags: "#OneWeekLeft #FinalWeek #LeaveItAllOnTheFloor #FitnessChallenge #AlmostThere #AllOut",
      imagePrompt: `Countdown-themed gym photo, athlete in powerful pose or finishing a workout strong. "7 Days" or countdown visual element. Peak intensity lighting, dramatic shadows. Championship energy.`,
    },
    {
      number: 15,
      phase: "during",
      suggestedDate: addDays(start_date, 49),
      title: "Week 8 - Murph Day Hype",
      caption: `FINAL WEEK and we're going out with a BANG. Murph Day is here and our ${name} athletes are about to show the world what 8 weeks of dedication looks like. 1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run. This is the ultimate test. Let's see what you're made of.`,
      hashtags: "#Murph #MurphDay #TheUltimateTest #FitnessChallenge #FinalWeek #ProvingGround",
      imagePrompt: `Epic Murph workout scene -- athletes in weight vests, mid-workout, outdoor or gym setting. American flag or memorial element optional. Raw, powerful group fitness energy. Heroic workout atmosphere.`,
    },

    // POST-CHALLENGE
    {
      number: 16,
      phase: "post",
      suggestedDate: addDays(end_date, 3),
      title: "Results / Transformation Reveal",
      caption: `THE RESULTS ARE IN. 8 weeks of the ${name} at ${gymName} and the transformations are absolutely INCREDIBLE. Our athletes gave everything they had and the results speak for themselves. Pounds lost. Muscle gained. PRs shattered. But the real transformation? The confidence, discipline, and habits that will last forever. Swipe to see some of our amazing before & afters.`,
      hashtags: "#TransformationReveal #BeforeAndAfter #Results #FitnessChallenge #ProudCoach #Transformation",
      imagePrompt: `Before and after transformation collage layout, bright and celebratory. Clean white background with results stats. Confetti or celebration elements. Professional transformation reveal aesthetic with space for multiple photos.`,
    },
    {
      number: 17,
      phase: "post",
      suggestedDate: addDays(end_date, 7),
      title: "Thank You / Next Challenge Tease",
      caption: `THANK YOU to every single athlete who committed to the ${name}. You showed up when it was hard. You stayed disciplined when motivation faded. You pushed through when your body wanted to quit. We are SO proud of this community. And if you're already thinking "what's next?"... stay tuned. Something even BIGGER is coming. The best is yet to come.`,
      hashtags: "#ThankYou #GymFamily #Community #FitnessChallenge #WhatsNext #StayTuned",
      imagePrompt: `Warm group photo of all challenge participants, smiling and celebrating together in the gym. Community feel, arms around shoulders, genuine joy. "Thank You" text overlay space. Golden hour or warm lighting.`,
    },
  ];

  return posts;
}

const phaseLabels: Record<PostData["phase"], string> = {
  "pre-launch": "Pre-Launch",
  during: "During Challenge",
  post: "Post-Challenge",
};

const phaseColors: Record<PostData["phase"], string> = {
  "pre-launch": "bg-blue-100 text-blue-700",
  during: "bg-green-100 text-green-700",
  post: "bg-purple-100 text-purple-700",
};

const statusColors: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-yellow-100 text-yellow-700",
  posted: "bg-green-100 text-green-700",
};

const statusOrder: PostStatus[] = ["draft", "scheduled", "posted"];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
      }`}
    >
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function StatusToggle({
  status,
  onChange,
}: {
  status: PostStatus;
  onChange: (s: PostStatus) => void;
}) {
  const cycle = () => {
    const idx = statusOrder.indexOf(status);
    const next = statusOrder[(idx + 1) % statusOrder.length];
    onChange(next);
  };

  return (
    <button
      onClick={cycle}
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${statusColors[status]}`}
      title="Click to cycle status"
    >
      {status}
    </button>
  );
}

export default function MarketingPosts({
  challenge,
  gymName,
  challengeId,
  savedStatuses,
}: {
  challenge: Challenge;
  gymName: string;
  challengeId: string;
  savedStatuses: Record<string, string>;
}) {
  const posts = useMemo(
    () => generatePosts(challenge, gymName),
    [challenge, gymName]
  );

  const [statuses, setStatuses] = useState<Record<number, PostStatus>>(() => {
    const initial: Record<number, PostStatus> = {};
    posts.forEach((p) => {
      const saved = savedStatuses[String(p.number)] as PostStatus | undefined;
      initial[p.number] = saved && statusOrder.includes(saved) ? saved : "draft";
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const [filterPhase, setFilterPhase] = useState<"all" | PostData["phase"]>("all");

  const filtered = useMemo(() => {
    if (filterPhase === "all") return posts;
    return posts.filter((p) => p.phase === filterPhase);
  }, [posts, filterPhase]);

  const counts = useMemo(() => {
    const c = { draft: 0, scheduled: 0, posted: 0 };
    Object.values(statuses).forEach((s) => c[s]++);
    return c;
  }, [statuses]);

  const updateStatus = async (postNumber: number, newStatus: PostStatus) => {
    const updated = { ...statuses, [postNumber]: newStatus };
    setStatuses(updated);

    // Persist to DB
    setSaving(true);
    try {
      const dbStatuses: Record<string, string> = {};
      Object.entries(updated).forEach(([k, v]) => { dbStatuses[k] = v; });
      await fetch(`/api/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_statuses: dbStatuses }),
      });
    } catch {
      // Silent fail — status is updated locally regardless
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Stats Bar */}
      {saving && <p className="text-xs text-gray-400 mb-2 text-right">Saving...</p>}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-gray-900">{counts.draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-yellow-600">{counts.scheduled}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-sm text-gray-500">Posted</p>
          <p className="text-2xl font-bold text-green-600">{counts.posted}</p>
        </div>
      </div>

      {/* Phase Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 mr-1">Filter:</span>
        {(["all", "pre-launch", "during", "post"] as const).map((phase) => (
          <button
            key={phase}
            onClick={() => setFilterPhase(phase)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterPhase === phase
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {phase === "all"
              ? `All (${posts.length})`
              : `${phaseLabels[phase]} (${posts.filter((p) => p.phase === phase).length})`}
          </button>
        ))}
      </div>

      {/* Post Cards */}
      <div className="space-y-6">
        {filtered.map((post) => (
          <div
            key={post.number}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold">
                  {post.number}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <p className="text-xs text-gray-500">
                    Suggested: {formatDate(post.suggestedDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${phaseColors[post.phase]}`}
                >
                  {phaseLabels[post.phase]}
                </span>
                <StatusToggle
                  status={statuses[post.number]}
                  onChange={(s) => updateStatus(post.number, s)}
                />
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Caption
                  </h4>
                  <CopyButton text={post.caption} label="Caption" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {post.caption}
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Hashtags
                  </h4>
                  <CopyButton text={post.hashtags} label="Hashtags" />
                </div>
                <p className="text-sm text-red-600 bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {post.hashtags}
                </p>
              </div>

              {/* Image Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    AI Image Prompt
                  </h4>
                  <CopyButton text={post.imagePrompt} label="Prompt" />
                </div>
                <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {post.imagePrompt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
