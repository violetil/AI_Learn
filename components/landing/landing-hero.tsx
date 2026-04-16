import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingHero({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const primaryHref = isLoggedIn ? "/dashboard" : "/register";
  const primaryText = isLoggedIn ? "Start Learning" : "Get Started";

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:pb-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#615d59]">
            AI EDUCATION PLATFORM
          </p>
          <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-[rgba(0,0,0,0.95)] sm:text-5xl">
            AI 辅助学习与智能作业批改，一体化完成学习闭环
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#615d59] sm:text-lg">
            从课程学习、作业提交到 AI 反馈与教师审核，帮助学生更高效学习，帮助教师更高效教学。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={primaryHref}>{primaryText}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/chat">Learn More</Link>
            </Button>
          </div>
        </div>

        <Card className="border-[rgba(0,0,0,0.09)] bg-white/95 transition-transform duration-300 hover:-translate-y-1">
          <CardContent className="space-y-4 p-6">
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#615d59]">
                作业 AI 初评
              </p>
              <p className="mt-2 text-sm text-[rgba(0,0,0,0.95)]">
                结构清晰，论证完整。建议补充 2 个案例并强化结论部分。
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#615d59]">
                学习助手
              </p>
              <p className="mt-2 text-sm text-[rgba(0,0,0,0.95)]">
                “帮我总结本节关键概念，并给 3 道分层练习题。”
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <span className="text-sm font-medium text-[rgba(0,0,0,0.95)]">
                学习进度建议
              </span>
              <span className="rounded-full bg-[#f2f9ff] px-2.5 py-1 text-xs font-semibold text-[#097fe8]">
                本周 +12%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
