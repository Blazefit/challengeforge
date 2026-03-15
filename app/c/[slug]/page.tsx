export default async function ChallengeSignup({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Challenge Signup</h1>
        <p className="text-gray-500 mb-8">Slug: {slug}</p>
        <p className="text-gray-500">Public signup flow — coming soon</p>
      </div>
    </div>
  );
}
