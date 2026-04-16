import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-[#615d59] sm:flex-row sm:items-center sm:px-6">
        <p>© {new Date().getFullYear()} AI Learn. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-[rgba(0,0,0,0.95)]">
            Login
          </Link>
          <Link href="/register" className="hover:text-[rgba(0,0,0,0.95)]">
            Register
          </Link>
          <Link href="/chat" className="hover:text-[rgba(0,0,0,0.95)]">
            AI Chat
          </Link>
        </div>
      </div>
    </footer>
  );
}
