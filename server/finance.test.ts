import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { answerDeterministically, financialSnapshot } from "./financeData";

function createContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("CredWise finance", () => {
  it("returns a connected financial snapshot with deterministic metrics", async () => {
    const result = await appRouter.createCaller(createContext()).finance.profile();
    expect(result.profile.user.name).toBe("Arjun Mehta");
    expect(result.profile.summary.netWorth).toBe(4286500);
    expect(result.metrics.savingsRate).toBe(28.7);
    expect(result.metrics.totalDebt).toBe(3630600);
  });

  it("calculates a what-if car scenario without inventing profile data", async () => {
    const result = await appRouter.createCaller(createContext()).finance.simulate({ price: 500000, downPayment: 200000, annualRate: 10.5, years: 5 });
    expect(result.emi).toBeGreaterThan(0);
    expect(result.remainingCash).toBe(634200);
    expect(result.runwayMonths).toBeGreaterThan(4);
    expect(result.verdict).toContain("runway");
  });

  it("answers common advisor questions from the same source profile", () => {
    const answer = answerDeterministically("What is my net worth?");
    expect(answer).toContain("₹42,86,500");
    expect(answer).toContain("28.7%");
    expect(financialSnapshot().profile.summary.creditScore).toBe(742);
  });
});
