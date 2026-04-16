const steps = [
  {
    title: "选择课程",
    desc: "加入课程后，系统自动关联学习内容与作业任务。",
  },
  {
    title: "学习与提交",
    desc: "按课程节奏学习，完成作业并提交到系统。",
  },
  {
    title: "AI 辅助提升",
    desc: "获得 AI 初评与个性化建议，持续优化学习效果。",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-[-0.01em] text-[rgba(0,0,0,0.95)] sm:text-4xl">
          How it works
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1"
          >
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f2f9ff] px-2 text-xs font-semibold text-[#097fe8]">
              {idx + 1}
            </span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-[rgba(0,0,0,0.95)]">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#615d59]">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
