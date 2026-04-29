"use client";

import {
  Bar,
  BarChart,
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

export function TeacherLearningPanel({
  analytics,
}: {
  analytics: DashboardLearningAnalytics | null;
}) {
  if (!analytics || analytics.roleView !== "TEACHER") {
    return (
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#faf9f8] p-6 text-sm text-[#615d59]">
        暂无课程学习数据，等待学生开始学习后自动生成分析。
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
        <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">课程学习趋势（近14天）</h3>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">行为构成</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.behaviorBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="次数" fill="#097fe8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.95)]">学习投入排行</h3>
          <div className="mt-3 space-y-2">
            {(analytics.topLearners ?? []).length === 0 ? (
              <p className="text-sm text-[#615d59]">暂无学生学习数据。</p>
            ) : (
              (analytics.topLearners ?? []).map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-[#f8f7f6] px-3 py-2"
                >
                  <p className="text-sm text-[rgba(0,0,0,0.92)]">{item.name}</p>
                  <p className="text-xs text-[#615d59]">
                    {item.minutes} 分钟 · 提交 {item.submissions}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
