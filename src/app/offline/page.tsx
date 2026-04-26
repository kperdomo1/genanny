"use client";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">📡</div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">
        You&apos;re offline
      </h1>
      <p className="mt-2 text-sm text-gray-600 max-w-xs">
        Genanny needs an internet connection to chat with you. Please check your
        connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
