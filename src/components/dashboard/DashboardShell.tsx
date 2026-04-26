"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { BabySelector } from "./BabySelector";
import type { Profile, Baby } from "@/lib/types";

export function DashboardShell({
  profile,
  babies,
  children,
}: {
  profile: Profile | null;
  babies: Baby[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const showBabySelector =
    pathname.startsWith("/dashboard/chat") ||
    pathname === "/dashboard";

  return (
    <div className="flex h-full min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
          Genanny
        </Link>

        {showBabySelector && babies.length > 0 && (
          <BabySelector babies={babies} />
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700"
          >
            {profile?.display_name?.[0]?.toUpperCase() ?? "U"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2 text-sm text-gray-500">
                {profile?.display_name ?? "User"}
              </div>
              <Link
                href="/dashboard/conversations"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Conversations
              </Link>
              <Link
                href="/dashboard/memory"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Memory
              </Link>
              <Link
                href="/dashboard/babies"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Manage babies
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
