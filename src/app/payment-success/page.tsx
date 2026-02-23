export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white dark:from-zinc-900 dark:to-zinc-950 px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Payment Successful!
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-2">
          Thank you for your purchase. Your program is now active.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-8">
          You can close this page and return to the app.
        </p>
        <a
          href="/client/training"
          className="inline-block px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          Go to Training →
        </a>
      </div>
    </div>
  )
}
