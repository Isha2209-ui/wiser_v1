import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { answerDeterministically, financialSnapshot } from "./financeData";

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "demo-user",
      name: "Demo User",
      email: "demo@credwise.ai",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("CredWise finance", () => {
  it("returns a connected financial snapshot with deterministic metrics", async () => {
    const result = await appRouter.createCaller(createContext()).finance.profile();
    expect(result.profile.user.name).toBe("CredWise Member");
    expect(result.profile.summary.netWorth).toBe(4286500);
    expect(result.metrics.savingsRate).toBe(28.7);
    expect(result.metrics.totalDebt).toBe(3630600);
  });

  it("answers common advisor questions from the same source profile", () => {
    const answer = answerDeterministically("What is my net worth?");
    expect(answer).toContain("₹42,86,500");
    expect(answer).toContain("28.7%");
    expect(financialSnapshot().profile.summary.creditScore).toBe(742);
  });

  it("returns a complete document record for the document review workspace", async () => {
    const result = await appRouter.createCaller(createContext()).finance.documents();
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.pages).toBe(6);
    expect(result.documents[0]?.summary.transactionCount).toBe(42);
    expect(result.documents[0]?.summary.takeaways.length).toBeGreaterThanOrEqual(4);
  });
});
