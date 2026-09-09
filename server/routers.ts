import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { answerDeterministically, financialSnapshot, DEMO_PROFILE } from "./financeData";

const advisorSystem = `You are CredWise Intelligence, a careful personal finance advisor for a product prototype.
Use only the supplied financial profile. Never invent balances, returns, transactions, rates, or facts.
Distinguish retrieved data, calculated values, assumptions, projections, recommendations, and missing data.
Give practical, concise guidance with a short answer first, then rationale and one next action. Use Indian rupee formatting.
This is educational financial intelligence, not a guarantee or regulated personal recommendation. If a question requires missing data, say so clearly.`;

function scenarioResult(price: number, downPayment: number, annualRate: number, years: number) {
  const principal = Math.max(price - downPayment, 0);
  const months = Math.max(years * 12, 1);
  const monthlyRate = annualRate / 100 / 12;
  const emi = monthlyRate === 0 ? principal / months : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const remainingCash = DEMO_PROFILE.summary.liquidCash - downPayment;
  const newSurplus = DEMO_PROFILE.summary.monthlySurplus - emi;
  return {
    price,
    downPayment,
    principal,
    annualRate,
    years,
    emi: Math.round(emi),
    remainingCash,
    newSurplus: Math.round(newSurplus),
    runwayMonths: Math.round((remainingCash / DEMO_PROFILE.summary.monthlyExpenses) * 10) / 10,
    verdict: remainingCash < DEMO_PROFILE.summary.monthlyExpenses * 6 ? "Below six months of runway" : newSurplus < 0 ? "Monthly cash flow turns negative" : "Within current planning guardrails",
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  finance: router({
    profile: publicProcedure.query(() => financialSnapshot()),
    ask: publicProcedure
      .input(z.object({ question: z.string().min(1).max(1200), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(12).optional() }))
      .mutation(async ({ input }) => {
        const context = JSON.stringify(financialSnapshot());
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            reasoning: { effort: "low" },
            messages: [
              { role: "system", content: advisorSystem },
              { role: "system", content: `Retrieved financial profile and deterministic metrics:\n${context}` },
              ...(input.history ?? []).map(message => ({ role: message.role as "user" | "assistant", content: message.content })),
              { role: "user", content: input.question },
            ],
          });
          const content = response.choices[0]?.message?.content;
          if (typeof content === "string" && content.trim()) return { answer: content, source: "CredWise Intelligence" as const };
        } catch (error) {
          console.warn("[CredWise] LLM unavailable, using deterministic advisor fallback", error);
        }
        return { answer: answerDeterministically(input.question), source: "Deterministic profile analysis" as const };
      }),
    simulate: publicProcedure
      .input(z.object({ price: z.number().min(0).max(100000000), downPayment: z.number().min(0).max(100000000), annualRate: z.number().min(0).max(50), years: z.number().int().min(1).max(30) }))
      .query(({ input }) => scenarioResult(input.price, input.downPayment, input.annualRate, input.years)),
  }),
});

export type AppRouter = typeof appRouter;
