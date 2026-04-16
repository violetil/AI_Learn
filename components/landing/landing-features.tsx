import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI 作业智能批改",
    desc: "自动提取优点、问题与改进建议，帮助学生快速定位薄弱点。",
  },
  {
    title: "AI 学习助手聊天",
    desc: "围绕课程内容问答、总结与练习生成，提供即时学习支持。",
  },
  {
    title: "个性化学习建议",
    desc: "基于学习行为与提交记录，给出节奏调整与复习优先级建议。",
  },
  {
    title: "教师辅助工具",
    desc: "教师可查看 AI 初评结果并进行审核，减少重复性批改负担。",
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-[-0.01em] text-[rgba(0,0,0,0.95)] sm:text-4xl">
          为学习与教学打造的核心能力
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#615d59]">
          用极简交互承载复杂学习流程，让 AI 真正融入课程、作业和反馈闭环。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-[22px] font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-7">{feature.desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
