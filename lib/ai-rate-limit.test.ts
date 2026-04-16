import { afterEach, describe, expect, it } from "vitest";
import { __resetAiRateLimitForTests, takeAiTurn } from "./ai-rate-limit";

afterEach(() => {
  __resetAiRateLimitForTests();
});

describe("takeAiTurn", () => {
  it("allows burst under cap", () => {
    for (let i = 0; i < 40; i += 1) {
      expect(takeAiTurn("u1").ok).toBe(true);
    }
    expect(takeAiTurn("u1").ok).toBe(false);
  });

  it("tracks users independently", () => {
    expect(takeAiTurn("a").ok).toBe(true);
    expect(takeAiTurn("b").ok).toBe(true);
  });
});
