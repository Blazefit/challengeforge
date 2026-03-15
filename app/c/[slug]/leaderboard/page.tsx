export default async function PublicLeaderboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400 mb-8">Challenge: {slug}</p>
        <p className="text-gray-400">Public leaderboard — coming soon</p>
      </div>
    </div>
  );
}
