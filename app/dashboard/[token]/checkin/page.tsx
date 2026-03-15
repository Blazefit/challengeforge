export default async function CheckIn({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Daily Check-In</h1>
        <p className="text-gray-500">Check-in form — coming soon</p>
      </div>
    </div>
  );
}
