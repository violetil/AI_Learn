import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(0,0,0,0.1)] bg-white text-sm font-bold text-[rgba(0,0,0,0.95)]">
            AI
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[rgba(0,0,0,0.95)]">
            AI Learn
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
