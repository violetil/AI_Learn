import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingAiShowcase() {
  return (
    <section className="bg-[#f6f5f4] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-[-0.01em] text-[rgba(0,0,0,0.95)] sm:text-4xl">
            AI 深度参与学习过程
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#615d59]">
            不止是问答工具，AI 会在学习、作业、反馈环节持续协作。
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">学习助手对话</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] p-3 text-sm">
                学生：请帮我总结“强化学习”这节课重点。
              </div>
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-3 text-sm">
                AI：我已整理 5 个核心概念，并附上 2 道基础题和 1 道进阶题。
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">作业智能批改</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-3">
                <p className="font-semibold text-[rgba(0,0,0,0.95)]">优势</p>
                <p className="mt-1 text-[#615d59]">结构完整、表达清晰，概念解释准确。</p>
              </div>
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-3">
                <p className="font-semibold text-[rgba(0,0,0,0.95)]">建议</p>
                <p className="mt-1 text-[#615d59]">增加案例分析，补充实验结果对比。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
