import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("email", user?.email ?? "")
    .single();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, name, slug, status, start_date, end_date")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {gym && (
            <p className="text-gray-500 mt-1">Welcome back, {gym.name}</p>
          )}
        </div>
        <a
          href="/admin/challenges/new"
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          + New Challenge
        </a>
      </div>

      {!gym && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-1">Complete Your Setup</h2>
          <p className="text-yellow-700 text-sm mb-3">
            Finish setting up your gym profile to get started.
          </p>
          <a
            href="/admin/onboarding"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Complete Onboarding
          </a>
        </div>
      )}

      {/* Challenges List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Your Challenges</h2>
        </div>

        {!challenges || challenges.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 mb-4">No challenges yet. Create your first one!</p>
            <a
              href="/admin/challenges/new"
              className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Create Challenge
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {challenges.map((c) => (
              <a
                key={c.id}
                href={`/admin/challenges/${c.id}`}
                className="block px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500">
                    /c/{c.slug} &middot; {c.start_date} to {c.end_date}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : c.status === "completed"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {c.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
