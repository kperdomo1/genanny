export default function ChatLoading() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Skeleton messages */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="h-10 w-48 animate-pulse rounded-2xl rounded-br-md bg-indigo-100" />
        </div>
        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="space-y-2">
            <div className="h-10 w-64 animate-pulse rounded-2xl rounded-bl-md bg-gray-100" />
            <div className="h-10 w-52 animate-pulse rounded-2xl rounded-bl-md bg-gray-100" />
          </div>
        </div>
        {/* Another pair */}
        <div className="flex justify-end">
          <div className="h-10 w-36 animate-pulse rounded-2xl rounded-br-md bg-indigo-100" />
        </div>
        <div className="flex justify-start">
          <div className="h-10 w-56 animate-pulse rounded-2xl rounded-bl-md bg-gray-100" />
        </div>
      </div>
      {/* Input skeleton */}
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
