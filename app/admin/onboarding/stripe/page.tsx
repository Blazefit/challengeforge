export default function StripeOnboarding() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Stripe</h1>
        <p className="text-gray-500 mb-6">Connect your Stripe account to receive payments from challenge participants.</p>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
          Connect with Stripe
        </button>
      </div>
    </div>
  );
}
