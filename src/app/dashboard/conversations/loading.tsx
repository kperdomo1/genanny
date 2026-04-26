export default function ConversationsLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="mt-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
