export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-red-600">ChallengeForge</span>
          <a
            href="/auth/signup"
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Get Started
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Run Transformation Challenges
          <br />
          <span className="text-red-600">Your Members Will Love</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          AI-generated personalized plans. Automated check-ins. Real-time
          leaderboards. Everything your gym needs to run world-class fitness
          challenges.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/signup"
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700"
          >
            Start Free Trial
          </a>
          <a
            href="#features"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            See How It Works
          </a>
        </div>

        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">3x3</div>
            <h3 className="font-semibold text-lg mb-2">Track &times; Tier Model</h3>
            <p className="text-gray-600 text-sm">
              Hard Gainer, Last 10, Transformer — each with Plan, Accelerator, and Elite support tiers.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">AI</div>
            <h3 className="font-semibold text-lg mb-2">Personalized Plans</h3>
            <p className="text-gray-600 text-sm">
              Claude AI generates custom nutrition and training plans based on each participant&apos;s intake data.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">$</div>
            <h3 className="font-semibold text-lg mb-2">Stripe Connect</h3>
            <p className="text-gray-600 text-sm">
              Payments go directly to your Stripe. ChallengeForge takes just 1% platform fee.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
