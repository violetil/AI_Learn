import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.08)] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-[#615d59] sm:flex-row sm:items-center sm:px-6">
        <p>© {new Date().getFullYear()} AI Learn. 保留所有权利。</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-[rgba(0,0,0,0.95)]">
            登录
          </Link>
          <Link href="/register" className="hover:text-[rgba(0,0,0,0.95)]">
            注册
          </Link>
          <Link href="/dashboard" className="hover:text-[rgba(0,0,0,0.95)]">
            工作台
          </Link>
        </div>
      </div>
    </footer>
  );
}
