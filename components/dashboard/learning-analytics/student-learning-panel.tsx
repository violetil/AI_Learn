"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardLearningAnalytics } from "@/lib/dashboard-data";

export function StudentLearningPanel({
  analytics,
}: {
  analytics: DashboardLearningAnalytics | null;
}) {
  if (!analytics || analytics.roleView !== "STUDENT") {
    return (
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#faf9f8] p-6 text-sm text-[#615d59]">
        暂无个人学习数据，完成一次资料学习或作业提交后可看到分析结果。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {analytics.summaryCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
            <p className="text-xs text-[#7a746f]">{card.label}</p>
            <p className="mt-1 text-xl font-semibold text-[rgba(0,0,0,0.95)]">{card.value}</p>
            <p className="mt-1 text-xs text-[#8a847f]">{card.hint}</p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">我的学习趋势（近14天）</h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="minutes" name="学习分钟" stroke="#097fe8" strokeWidth={2} />
              <Line type="monotone" dataKey="submissions" name="提交次数" stroke="#2a9d99" strokeWidth={2} />
              <Line type="monotone" dataKey="aiSessions" name="AI会话" stroke="#dd5b00" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">学习路径时间线</h3>
        <div className="mt-3 space-y-2">
          {(analytics.personalTimeline ?? []).length === 0 ? (
            <p className="text-sm text-[#615d59]">暂无可展示路径。</p>
          ) : (
            (analytics.personalTimeline ?? []).map((item, index) => (
              <div key={`${item.time}-${index}`} className="rounded-lg bg-[#f8f7f6] px-3 py-2">
                <p className="text-xs text-[#8a847f]">{item.time}</p>
                <p className="mt-0.5 text-sm text-[rgba(0,0,0,0.92)]">{item.event}</p>
                <p className="text-xs text-[#615d59]">{item.detail}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
