"use client";

type ContentCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  due?: string;
};

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SectionBlock({
  title,
  description,
  cards,
  emphasizeDue = false,
}: {
  title: string;
  description: string;
  cards: ContentCard[];
  emphasizeDue?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[rgba(0,0,0,0.95)]">{title}</h3>
        <p className="text-sm text-[#615d59]">{description}</p>
      </div>

      <div className="rounded-2xl bg-[#f7f6f5]/70 p-2 transition-colors duration-200 hover:bg-[#f5f4f3]">
        <div className="flex snap-x snap-proximity gap-3 overflow-x-auto px-0.5 pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((card) => (
            <article
              key={card.id}
              className="min-w-[16rem] snap-start rounded-2xl bg-[#fbfbfa] p-4 ring-1 ring-[rgba(0,0,0,0.04)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <p className="truncate text-sm font-semibold leading-6 text-[rgba(0,0,0,0.95)]">{card.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6f6964]">{card.subtitle}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[#8a847f]">{card.meta}</span>
                {emphasizeDue && card.due ? (
                  <span className="rounded-full bg-[#f2f9ff] px-2 py-1 text-[11px] font-semibold text-[#097fe8]">
                    截止 {card.due}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CourseHome({
  courseTitle,
  courseCode,
}: {
  courseTitle: string;
  courseCode: string;
}) {
  const greeting = getGreetingByTime();

  const recentItems: ContentCard[] = [
    {
      id: "rv-1",
      title: "第二章总结",
      subtitle: "回顾核心概念并复习关键示例。",
      meta: "阅读 5 分钟",
    },
    {
      id: "rv-2",
      title: "作业草稿",
      subtitle: "你之前提交的模型评估任务草稿。",
      meta: "2 小时前编辑",
    },
    {
      id: "rv-3",
      title: "课堂讨论笔记",
      subtitle: "关于训练流程与推理链路的课堂记录。",
      meta: "阅读 8 分钟",
    },
  ];

  const materials: ContentCard[] = [
    {
      id: "lm-1",
      title: "特征工程基础",
      subtitle: "理解数据预处理与特征选择方法。",
      meta: "阅读 12 分钟",
    },
    {
      id: "lm-2",
      title: "模型评估指南",
      subtitle: "精确率、召回率与混淆矩阵详解。",
      meta: "阅读 10 分钟",
    },
    {
      id: "lm-3",
      title: "学习场景下的提示词",
      subtitle: "如何向 AI 提问以获得更高质量学习支持。",
      meta: "阅读 7 分钟",
    },
  ];

  const assignments: ContentCard[] = [
    {
      id: "as-1",
      title: "回归分析作业",
      subtitle: "提交模型对比结果与实验结论说明。",
      meta: "作业",
      due: "4 月 18 日",
    },
    {
      id: "as-2",
      title: "案例反思报告",
      subtitle: "分析一个 AI 辅助学习场景并给出改进建议。",
      meta: "报告",
      due: "4 月 21 日",
    },
    {
      id: "as-3",
      title: "测验前练习",
      subtitle: "在 AI 指导下完成测验前的分层练习。",
      meta: "练习",
      due: "4 月 24 日",
    },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2 pt-1">
        <h2 className="text-[2.7rem] font-bold tracking-[-0.03em] text-[rgba(0,0,0,0.95)]">
          {greeting}
        </h2>
        <p className="text-sm text-[#615d59]">
          {courseTitle} · {courseCode}
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7a746f]">
          最近访问
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {recentItems.map((item) => (
            <article
              key={item.id}
              className="min-w-[12rem] rounded-2xl bg-[#faf9f8] p-4 ring-1 ring-[rgba(0,0,0,0.03)] shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
            >
              <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.95)]">{item.title}</p>
              <p className="mt-1 text-xs text-[#8a847f]">{item.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <SectionBlock
        title="学习资料"
        description="从上次学习进度继续，保持稳定的学习节奏。"
        cards={materials}
      />

      <SectionBlock
        title="作业任务"
        description="关注临近截止时间，按计划完成每项学习任务。"
        cards={assignments}
        emphasizeDue
      />

      <section className="rounded-2xl bg-[#faf9f8] p-4 ring-1 ring-[rgba(0,0,0,0.04)] shadow-[0_1px_2px_rgba(0,0,0,0.015)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-medium text-[rgba(0,0,0,0.95)]">课程动态</p>
        <p className="mt-1 text-sm leading-6 text-[#6f6964]">
          AI 助手已与当前课程上下文绑定，可提供更有针对性的学习建议与答疑支持。
        </p>
      </section>
    </div>
  );
}
