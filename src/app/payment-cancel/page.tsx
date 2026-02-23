export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔙</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Payment Cancelled
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          No worries — you can return to the app and try again whenever you&apos;re ready.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}
