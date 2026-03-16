import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MarketingPosts from "./MarketingPosts";

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

export default async function Marketing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("email", user?.email ?? "")
    .single();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, name, slug, start_date, end_date, status, early_bird_ends, tracks(id, name, description), tiers(id, name, price_cents)")
    .eq("gym_id", gym?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marketing Hub</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400 mb-4">
            No challenges found. Create a challenge first to generate marketing content.
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

  const typedChallenge: Challenge = {
    id: challenge.id,
    name: challenge.name,
    slug: challenge.slug,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
    status: challenge.status,
    early_bird_ends: challenge.early_bird_ends ?? null,
    tracks: (challenge.tracks ?? []) as Track[],
    tiers: (challenge.tiers ?? []) as Tier[],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Hub</h1>
          <p className="text-gray-500 mt-1">
            Auto-generated Instagram posts for{" "}
            <span className="font-medium text-gray-700">{typedChallenge.name}</span>
          </p>
        </div>
        <Link
          href={`/admin/challenges/${typedChallenge.id}`}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          View Challenge
        </Link>
      </div>

      <MarketingPosts challenge={typedChallenge} gymName={gym?.name ?? "Your Gym"} />
    </div>
  );
}
