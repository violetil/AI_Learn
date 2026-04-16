import { describe, expect, it } from "vitest";
import { err, ok } from "./api-response";

describe("api-response", () => {
  it("ok wraps data", () => {
    expect(ok({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });

  it("err wraps message", () => {
    expect(err("bad")).toEqual({ success: false, error: "bad" });
  });
});
