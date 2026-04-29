import { describe, expect, it } from "vitest";
import { buildOrchestratedCourseSystemPrompt } from "@/lib/chat-prompt-orchestrator";

describe("buildOrchestratedCourseSystemPrompt", () => {
  const ctx = {
    courseTitle: "测试课程",
    courseDescription: "简介",
    materials: [
      {
        title: "讲义 A",
        kind: "DOCUMENT",
        url: null,
        content: "第一段内容",
        position: 0,
      },
    ],
  };

  it("student + RAG: natural snippet headers without similarity scores", () => {
    const text = buildOrchestratedCourseSystemPrompt({
      ctx,
      viewerRole: "STUDENT",
      ragSnippets: [
        {
          chunkId: "c1",
          materialTitle: "讲义 A",
          content: "命中片段",
          similarity: 0.88,
        },
      ],
      studentStateSummary: "- 近期提交 1 次作业",
      teacherCourseSummary: null,
      ragMode: "rag",
    });
    expect(text).toContain("课程助教");
    expect(text).toContain("在读学生");
    expect(text).toContain("个人学习概况");
    expect(text).toContain("检索到的课程片段");
    expect(text).toContain("命中片段");
    expect(text).toContain("### 1. 讲义 A");
    expect(text).not.toContain("相似度");
    expect(text).not.toContain("课程资料（全文上下文");
    expect(text).toContain("表达风格");
  });

  it("teacher + fallback: class overview section", () => {
    const text = buildOrchestratedCourseSystemPrompt({
      ctx,
      viewerRole: "TEACHER",
      ragSnippets: [],
      studentStateSummary: null,
      teacherCourseSummary: "- 在读学生人数：3",
      ragMode: "fallback",
    });
    expect(text).toContain("教学助理");
    expect(text).toContain("管理教师");
    expect(text).toContain("班级与课程活动概况");
    expect(text).toContain("在读学生人数：3");
    expect(text).toContain("课程资料（全文上下文");
    expect(text).toContain("第一段内容");
    expect(text).not.toContain("个人学习概况");
  });

  it("student fallback uses full materials", () => {
    const text = buildOrchestratedCourseSystemPrompt({
      ctx,
      viewerRole: "STUDENT",
      ragSnippets: [],
      studentStateSummary: null,
      teacherCourseSummary: null,
      ragMode: "fallback",
    });
    expect(text).toContain("课程资料（全文上下文");
    expect(text).toContain("第一段内容");
  });
});
