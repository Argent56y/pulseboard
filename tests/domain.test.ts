import { describe, expect, it } from "vitest";
import { canManageMembers, canTransitionFeedbackStatus, voteIdentity } from "@/lib/domain";

describe("role checks", () => {
  it("reserves member management for owners", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("editor")).toBe(false);
  });
});

describe("feedback workflow", () => {
  it("allows the normal triage path", () => {
    expect(canTransitionFeedbackStatus("new", "under_review")).toBe(true);
    expect(canTransitionFeedbackStatus("under_review", "planned")).toBe(true);
    expect(canTransitionFeedbackStatus("in_progress", "shipped")).toBe(true);
  });

  it("blocks unexplained jumps", () => {
    expect(canTransitionFeedbackStatus("new", "shipped")).toBe(false);
    expect(canTransitionFeedbackStatus("shipped", "planned")).toBe(false);
  });
});

describe("vote identity", () => {
  it("is stable for the database uniqueness pair", () => {
    const first = voteIdentity("feedback-a", "user-a");
    expect(voteIdentity("feedback-a", "user-a")).toBe(first);
    expect(voteIdentity("feedback-a", "user-b")).not.toBe(first);
  });
});
