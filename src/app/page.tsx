import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">
        Genanny
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-md">
        Your 24/7 AI pediatric advisor that remembers everything about your
        baby.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
