import { describe, expect, it } from "vitest";
import { feedbackSchema, workspaceSchema } from "@/lib/validations";

describe("workspace validation", () => {
  it("accepts a useful public slug", () => {
    expect(workspaceSchema.safeParse({ name: "Acme Product", slug: "acme-product" }).success).toBe(true);
  });

  it("rejects mixed case and unsafe separators", () => {
    expect(workspaceSchema.safeParse({ name: "Acme", slug: "Acme_Product" }).success).toBe(false);
  });
});

describe("feedback validation", () => {
  it("requires meaningful copy and tenant identifiers", () => {
    const result = feedbackSchema.safeParse({ workspaceId: crypto.randomUUID(), boardId: crypto.randomUUID(), title: "Too short", body: "Needs a clearer mobile capture workflow." });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed workspace id", () => {
    expect(feedbackSchema.safeParse({ workspaceId: "demo", boardId: crypto.randomUUID(), title: "Useful title", body: "A sufficiently useful description." }).success).toBe(false);
  });
});
