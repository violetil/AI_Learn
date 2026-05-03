import "dotenv/config";
import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import { generateAssistantReply, streamAssistantReply } from "@/lib/ai";
import type { CourseContextPayload } from "@/lib/course-context";
import type { RagSnippet } from "@/lib/chat-prompt-orchestrator";

type LatencyStats = {
  runs: number;
  success: number;
  failure: number;
  avgMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
};

type StreamLatencyStats = LatencyStats & {
  avgFirstTokenMs: number;
  p95FirstTokenMs: number;
};

type RagScore = {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
};

type MetricsOutput = {
  generatedAt: string;
  model: string;
  baseUrl: string;
  mode: "live" | "demo";
  nonStreaming: LatencyStats;
  streaming: StreamLatencyStats;
  ragAblation: {
    sampleSize: number;
    withoutRag: RagScore & { avgLatencyMs: number };
    withRag: RagScore & { avgLatencyMs: number };
  };
  availability: {
    totalRequests: number;
    successRequests: number;
    score: number;
  };
};

const RUNS = 12;
const STREAM_RUNS = 12;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

function toLatencyStats(times: number[], failures: number): LatencyStats {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const success = sorted.length;
  return {
    runs: success + failures,
    success,
    failure: failures,
    avgMs: success ? Number((sum / success).toFixed(2)) : 0,
    p95Ms: Number(percentile(sorted, 95).toFixed(2)),
    minMs: Number((sorted[0] ?? 0).toFixed(2)),
    maxMs: Number((sorted[sorted.length - 1] ?? 0).toFixed(2)),
  };
}

function toStreamLatencyStats(
  totalTimes: number[],
  firstTokenTimes: number[],
  failures: number,
): StreamLatencyStats {
  const base = toLatencyStats(totalTimes, failures);
  const sortedFirst = [...firstTokenTimes].sort((a, b) => a - b);
  const firstSum = sortedFirst.reduce((acc, n) => acc + n, 0);
  return {
    ...base,
    avgFirstTokenMs: sortedFirst.length
      ? Number((firstSum / sortedFirst.length).toFixed(2))
      : 0,
    p95FirstTokenMs: Number(percentile(sortedFirst, 95).toFixed(2)),
  };
}

function buildCourseContext(): CourseContextPayload {
  return {
    courseTitle: "软件工程与智能系统实现",
    courseDescription: "围绕全栈系统设计、鉴权机制、RAG流程和测试工程实践。",
    materials: [
      {
        title: "JWT与Cookie双通道鉴权规范",
        kind: "DOCUMENT",
        url: null,
        content:
          "接口需要支持 Cookie Session 与 Bearer JWT。未授权请求返回 401。",
        position: 1,
      },
      {
        title: "RAG检索链路与阈值策略",
        kind: "DOCUMENT",
        url: null,
        content:
          "先向量化问题，再Top-K检索，按相似度阈值过滤，最后进行提示词注入。",
        position: 2,
      },
      {
        title: "作业初评与教师复核闭环",
        kind: "DOCUMENT",
        url: null,
        content:
          "学生提交后先给出 AI 初评，教师进行最终审核确认。",
        position: 3,
      },
    ],
  };
}

const ragCases: Array<{
  question: string;
  expected: string[];
  snippet: RagSnippet;
}> = [
  {
    question: "平台如何处理未登录接口请求？",
    expected: ["401", "jwt"],
    snippet: {
      chunkId: "rag-1",
      materialTitle: "JWT与Cookie双通道鉴权规范",
      content: "未授权请求返回 401，支持 Cookie Session 与 Bearer JWT。",
      similarity: 0.91,
    },
  },
  {
    question: "课程问答怎样减少模型幻觉？",
    expected: ["top-k", "相似度"],
    snippet: {
      chunkId: "rag-2",
      materialTitle: "RAG检索链路与阈值策略",
      content: "先Top-K检索，再按相似度阈值过滤，最后注入提示词。",
      similarity: 0.9,
    },
  },
  {
    question: "作业反馈流程里老师的角色是什么？",
    expected: ["初评", "复核"],
    snippet: {
      chunkId: "rag-3",
      materialTitle: "作业初评与教师复核闭环",
      content: "AI 只做初评，教师负责最终复核确认。",
      similarity: 0.89,
    },
  },
  {
    question: "聊天接口为什么要做会话级鉴权？",
    expected: ["会话", "鉴权"],
    snippet: {
      chunkId: "rag-4",
      materialTitle: "JWT与Cookie双通道鉴权规范",
      content: "每次请求按 sessionId 绑定用户与课程进行鉴权。",
      similarity: 0.86,
    },
  },
  {
    question: "检索到的片段很多时系统如何控制上下文长度？",
    expected: ["字符预算", "截断"],
    snippet: {
      chunkId: "rag-5",
      materialTitle: "RAG检索链路与阈值策略",
      content: "设置最大字符预算，超出后按顺序截断。",
      similarity: 0.9,
    },
  },
  {
    question: "为什么要保留教师最终审核环节？",
    expected: ["教师", "最终"],
    snippet: {
      chunkId: "rag-6",
      materialTitle: "作业初评与教师复核闭环",
      content: "教师保留最终裁量权，AI 仅提供建议。",
      similarity: 0.87,
    },
  },
];

function scoreReplies(
  replies: string[],
  cases: Array<{ expected: string[] }>,
  vocab: string[],
): RagScore {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (let i = 0; i < replies.length; i++) {
    const text = replies[i].toLowerCase();
    const expected = new Set(cases[i].expected.map((k) => k.toLowerCase()));
    const predicted = new Set(
      vocab.filter((k) => text.includes(k.toLowerCase())).map((k) => k.toLowerCase()),
    );
    for (const key of predicted) {
      if (expected.has(key)) tp += 1;
      else fp += 1;
    }
    for (const key of expected) {
      if (!predicted.has(key)) fn += 1;
    }
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return {
    tp,
    fp,
    fn,
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
  };
}

async function run(): Promise<void> {
  const courseContext = buildCourseContext();
  const model = process.env.OPENAI_MODEL ?? "unknown";
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const mode: "live" | "demo" = process.env.OPENAI_API_KEY?.trim() ? "live" : "demo";

  const nonStreamTimes: number[] = [];
  let nonStreamFailures = 0;
  for (let i = 0; i < RUNS; i++) {
    const started = performance.now();
    try {
      await generateAssistantReply(
        [{ role: "user", content: `请概述第${i + 1}次测试的课程答疑策略。` }],
        {
          courseContext,
          orchestration: {
            viewerRole: "STUDENT",
            ragMode: "rag",
            ragSnippets: [
              {
                chunkId: `latency-${i + 1}`,
                materialTitle: "RAG检索链路与阈值策略",
                content: "先检索后注入，检索失败回退全文资料。",
                similarity: 0.88,
              },
            ],
            studentStateSummary: null,
            teacherCourseSummary: null,
          },
          model,
        },
      );
      nonStreamTimes.push(performance.now() - started);
    } catch {
      nonStreamFailures += 1;
    }
  }

  const streamTimes: number[] = [];
  const firstTokenTimes: number[] = [];
  let streamFailures = 0;
  for (let i = 0; i < STREAM_RUNS; i++) {
    const started = performance.now();
    let firstTokenAt = -1;
    try {
      await streamAssistantReply(
        [{ role: "user", content: `请给出第${i + 1}次测试的复习建议。` }],
        {
          courseContext,
          orchestration: {
            viewerRole: "STUDENT",
            ragMode: "rag",
            ragSnippets: [
              {
                chunkId: `stream-${i + 1}`,
                materialTitle: "作业初评与教师复核闭环",
                content: "AI 初评后教师复核，形成反馈闭环。",
                similarity: 0.9,
              },
            ],
            studentStateSummary: null,
            teacherCourseSummary: null,
          },
          model,
        },
        (chunk) => {
          if (chunk && firstTokenAt < 0) {
            firstTokenAt = performance.now();
          }
        },
      );
      const ended = performance.now();
      streamTimes.push(ended - started);
      if (firstTokenAt > 0) {
        firstTokenTimes.push(firstTokenAt - started);
      } else {
        firstTokenTimes.push(ended - started);
      }
    } catch {
      streamFailures += 1;
    }
  }

  const withoutRagReplies: string[] = [];
  const withRagReplies: string[] = [];
  const withoutRagLatencies: number[] = [];
  const withRagLatencies: number[] = [];
  for (const c of ragCases) {
    const noRagStarted = performance.now();
    const noRag = await generateAssistantReply(
      [{ role: "user", content: c.question }],
      {
        model,
      },
    ).catch(() => "");
    withoutRagLatencies.push(performance.now() - noRagStarted);
    withoutRagReplies.push(noRag);

    const ragStarted = performance.now();
    const rag = await generateAssistantReply(
      [{ role: "user", content: c.question }],
      {
        model,
        courseContext,
        orchestration: {
          viewerRole: "STUDENT",
          ragMode: "rag",
          ragSnippets: [c.snippet],
          studentStateSummary: null,
          teacherCourseSummary: null,
        },
      },
    ).catch(() => "");
    withRagLatencies.push(performance.now() - ragStarted);
    withRagReplies.push(rag);
  }

  const vocab = Array.from(new Set(ragCases.flatMap((c) => c.expected)));
  const withoutRagScore = {
    ...scoreReplies(withoutRagReplies, ragCases, vocab),
    avgLatencyMs: Number(
      (
        withoutRagLatencies.reduce((acc, n) => acc + n, 0) /
        Math.max(1, withoutRagLatencies.length)
      ).toFixed(2),
    ),
  };
  const withRagScore = {
    ...scoreReplies(withRagReplies, ragCases, vocab),
    avgLatencyMs: Number(
      (
        withRagLatencies.reduce((acc, n) => acc + n, 0) /
        Math.max(1, withRagLatencies.length)
      ).toFixed(2),
    ),
  };

  const nonStreaming = toLatencyStats(nonStreamTimes, nonStreamFailures);
  const streaming = toStreamLatencyStats(streamTimes, firstTokenTimes, streamFailures);

  const totalRequests = nonStreaming.runs + streaming.runs + ragCases.length * 2;
  const successRequests =
    nonStreaming.success + streaming.success + withoutRagReplies.filter(Boolean).length + withRagReplies.filter(Boolean).length;
  const availabilityScore = totalRequests > 0 ? successRequests / totalRequests : 0;

  const output: MetricsOutput = {
    generatedAt: new Date().toISOString(),
    model,
    baseUrl,
    mode,
    nonStreaming,
    streaming,
    ragAblation: {
      sampleSize: ragCases.length,
      withoutRag: withoutRagScore,
      withRag: withRagScore,
    },
    availability: {
      totalRequests,
      successRequests,
      score: Number(availabilityScore.toFixed(4)),
    },
  };

  await mkdir("docs", { recursive: true });
  await writeFile("docs/thesis-metrics.json", JSON.stringify(output, null, 2), "utf-8");

  const md = [
    "# Thesis Experiment Log",
    "",
    `- Generated at: ${output.generatedAt}`,
    `- Model: ${output.model}`,
    `- Base URL: ${output.baseUrl}`,
    `- Mode: ${output.mode}`,
    "",
    "## 1) Pipeline Latency",
    "",
    `- Non-streaming: runs=${nonStreaming.runs}, success=${nonStreaming.success}, avg=${nonStreaming.avgMs}ms, p95=${nonStreaming.p95Ms}ms`,
    `- Streaming total: runs=${streaming.runs}, success=${streaming.success}, avg=${streaming.avgMs}ms, p95=${streaming.p95Ms}ms`,
    `- Streaming first-token: avg=${streaming.avgFirstTokenMs}ms, p95=${streaming.p95FirstTokenMs}ms`,
    "",
    "## 2) RAG Ablation (Keyword-based rubric)",
    "",
    `- Sample size: ${output.ragAblation.sampleSize}`,
    `- Without RAG: precision=${output.ragAblation.withoutRag.precision}, recall=${output.ragAblation.withoutRag.recall}, f1=${output.ragAblation.withoutRag.f1}, avgLatency=${output.ragAblation.withoutRag.avgLatencyMs}ms`,
    `- With RAG: precision=${output.ragAblation.withRag.precision}, recall=${output.ragAblation.withRag.recall}, f1=${output.ragAblation.withRag.f1}, avgLatency=${output.ragAblation.withRag.avgLatencyMs}ms`,
    "",
    "## 3) Availability",
    "",
    `- Total requests: ${output.availability.totalRequests}`,
    `- Success requests: ${output.availability.successRequests}`,
    `- Availability score: ${output.availability.score}`,
    "",
    "## Notes",
    "",
    "- This benchmark is generated from project code paths (`lib/ai.ts`) and synthetic course prompts.",
    "- Raw machine-readable results are stored in `docs/thesis-metrics.json`.",
  ].join("\n");

  await writeFile("docs/thesis-experiment-log.md", md, "utf-8");
  process.stdout.write("thesis metrics collected\n");
}

run().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
