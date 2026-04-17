"use client";

type ContentCard = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  due?: string;
};

type OverviewData = {
  recentItems: ContentCard[];
  materials: ContentCard[];
  assignments: ContentCard[];
  courseUpdate: string;
};

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
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
  overviewData,
}: {
  courseTitle: string;
  courseCode: string;
  overviewData: OverviewData;
}) {
  const greeting = getGreetingByTime();
  const recentItems = overviewData.recentItems;
  const materials = overviewData.materials;
  const assignments = overviewData.assignments;

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
          {overviewData.courseUpdate}
        </p>
      </section>
    </div>
  );
}
