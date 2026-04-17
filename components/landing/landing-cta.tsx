import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  const href = isLoggedIn ? "/dashboard" : "/register";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)] sm:p-12">
        <h2 className="text-3xl font-bold tracking-[-0.01em] text-[rgba(0,0,0,0.95)] sm:text-4xl">
          开始构建更高效的学习体验
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#615d59]">
          从今天开始，让 AI 成为你的学习协作伙伴，提升作业质量与学习效率。
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={href}>免费开始使用</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
