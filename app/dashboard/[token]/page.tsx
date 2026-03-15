export default async function ParticipantDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
        <p className="text-gray-500">Participant home — coming soon</p>
        <p className="text-xs text-gray-300 mt-4">Token: {token}</p>
      </div>
    </div>
  );
}
