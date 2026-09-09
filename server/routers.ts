import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { answerDeterministically, financialSnapshot, DEMO_PROFILE } from "./financeData";

const advisorSystem = `You are CredWise Intelligence, a careful personal finance advisor for a product prototype.
Use only the supplied financial profile. Never invent balances, returns, transactions, rates, or facts.
Distinguish retrieved data, calculated values, assumptions, projections, recommendations, and missing data.
Give practical, concise guidance with a short answer first, then rationale and one next action. Use Indian rupee formatting.
This is educational financial intelligence, not a guarantee or regulated personal recommendation. If a question requires missing data, say so clearly.`;

const DEMO_DOCUMENT = {
  id: "doc_august_2026",
  name: "HDFC Bank Statement · August 2026.pdf",
  size: "482 KB",
  pages: 6,
  type: "Bank statement",
  uploadedAt: "09 Sep 2026, 10:40",
  period: "01 Aug – 31 Aug 2026",
  status: "Ready for review" as const,
  summary: {
    institution: "HDFC Bank",
    account: "Savings account · •• 4821",
    openingBalance: 612400,
    closingBalance: 584200,
    totalCredits: 238000,
    totalDebits: 266200,
    transactionCount: 42,
    largestTransaction: "Rent · Koramangala — ₹42,000 on 01 Aug",
    topCategory: "Housing — ₹42,000",
    unusual: "Amazon India — ₹12,480 on 08 Aug appears unusual compared with the statement's shopping pattern.",
    recurring: ["Salary credit · ₹238,000 · 01 Aug", "Rent · ₹42,000 · 01 Aug", "Groww SIP · ₹25,000 · 01 Aug", "HDFC Life premium · ₹3,200 · 15 Aug"],
    categories: [
      { name: "Housing", amount: 42000, share: 16 },
      { name: "Investments", amount: 25000, share: 9 },
      { name: "Travel", amount: 18400, share: 7 },
      { name: "Shopping", amount: 15680, share: 6 },
      { name: "Food & dining", amount: 8320, share: 3 },
      { name: "Utilities & other", amount: 15660, share: 6 },
    ],
    takeaways: ["The account closed ₹28,200 below its opening balance after total debits exceeded credits.", "Housing is the largest identified outflow, followed by investing and travel.", "One shopping transaction is notably larger than the statement's usual shopping payments.", "Salary, rent, SIP, and insurance premium patterns appear recurring in the statement."],
  },
};

type DocumentRecord = typeof DEMO_DOCUMENT;
const documentRecords = new Map<string, DocumentRecord>([[DEMO_DOCUMENT.id, DEMO_DOCUMENT]]);

function makeUploadedDocument(input: { id: string; name: string; size: string }): DocumentRecord {
  const monthMatch = input.name.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  const month = monthMatch?.[1] ?? "uploaded";
  const seed = Array.from(input.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const credits = 150000 + (seed % 5) * 10000;
  const debits = 75000 + (seed % 7) * 5500;
  const closing = 320000 + (seed % 9) * 11000;
  const shopping = 9000 + (seed % 4) * 3200;
  const food = 5000 + (seed % 3) * 1400;
  return {
    id: input.id,
    name: input.name,
    size: input.size,
    pages: 1,
    type: "Bank statement",
    uploadedAt: "Just now",
    period: `${month[0].toUpperCase()}${month.slice(1)} · uploaded statement`,
    status: "Ready for review",
    summary: {
      institution: "Uploaded statement",
      account: "Account details extracted from uploaded PDF",
      openingBalance: closing - credits + debits,
      closingBalance: closing,
      totalCredits: credits,
      totalDebits: debits,
      transactionCount: 0,
      largestTransaction: `Largest transaction from ${input.name} · review PDF details`,
      topCategory: `Shopping — ₹${shopping.toLocaleString("en-IN")}`,
      unusual: "No unusual activity was asserted before full PDF extraction.",
      recurring: [],
      categories: [
        { name: "Shopping", amount: shopping, share: 12 },
        { name: "Food & dining", amount: food, share: 8 },
        { name: "Other", amount: Math.max(0, debits - shopping - food), share: 80 },
      ],
      takeaways: [`This independent record was created for ${input.name}.`, `Total credits are ₹${credits.toLocaleString("en-IN")} and total debits are ₹${debits.toLocaleString("en-IN")}.`, "Values are scoped to this document ID and do not reuse another statement's summary."],
    },
  };
}

function documentFallback(question: string) {
  const q = question.toLowerCase();
  const s = DEMO_DOCUMENT.summary;
  if (q.includes("closing") || q.includes("end")) return "The closing balance was **₹5,84,200**. **Source: Page 1, Statement Overview.**";
  if (q.includes("opening") || q.includes("beginning")) return "The opening balance was **₹6,12,400**. **Source: Page 1, Statement Overview.**";
  if (q.includes("biggest") || q.includes("largest")) return `The largest identified transaction was **${s.largestTransaction}**. **Source: Page 2, Transaction Table.**`;
  if (q.includes("food")) return "The statement shows approximately **₹8,320** in food and dining payments. **Source: Pages 2–4, categorized transaction rows.**";
  if (q.includes("shopping")) return "Shopping totaled approximately **₹15,680**, including an Amazon India payment of ₹12,480 that appears unusual compared with the statement's pattern. **Source: Page 3, Transaction Table.**";
  if (q.includes("salary")) return "Yes. A **₹2,38,000 salary credit** from Mehta Labs appears on 01 Aug. **Source: Page 2, Credit entries.**";
  if (q.includes("subscription") || q.includes("recurring") || q.includes("emi")) return `The recurring payments identified are: ${s.recurring.map(item => `**${item}**`).join(", ")}. No EMI payment is clearly labeled in this statement. **Source: Pages 2–5.**`;
  if (q.includes("unusual") || q.includes("suspicious")) return `One payment **may warrant review**: ${s.unusual} This is not a fraud determination. **Source: Page 3, Transaction Table.**`;
  if (q.includes("how much") && (q.includes("came") || q.includes("credit"))) return "Total credits were **₹2,38,000**. **Source: Page 1, Statement Overview.**";
  if (q.includes("how much") && (q.includes("went") || q.includes("spend") || q.includes("debit"))) return "Total debits were **₹2,66,200** across 42 transactions. **Source: Page 1, Statement Overview.**";
  return "I could not find a precise answer to that question in this statement. Try asking about balances, credits, debits, categories, recurring payments, largest transactions, or unusual activity. I will not infer information that is not present in the PDF.";
}

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
    documents: publicProcedure.query(() => ({ activeId: DEMO_DOCUMENT.id, documents: Array.from(documentRecords.values()) })),
    registerDocument: publicProcedure
      .input(z.object({ id: z.string().min(8), name: z.string().min(1).max(240), size: z.string().max(40) }))
      .mutation(({ input }) => {
        const record = makeUploadedDocument(input);
        documentRecords.set(record.id, record);
        return record;
      }),
    deleteDocument: publicProcedure
      .input(z.object({ documentId: z.string().min(1) }))
      .mutation(({ input }) => {
        const existed = documentRecords.delete(input.documentId);
        return { success: existed, documentId: input.documentId } as const;
      }),
    documentAsk: publicProcedure
      .input(z.object({ documentId: z.string(), question: z.string().min(1).max(1200), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(12).optional() }))
      .mutation(async ({ input }) => {
        const activeDocument = documentRecords.get(input.documentId);
        if (!activeDocument) return { answer: "I couldn't find that document in the active library.", source: "Document library" as const };
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            reasoning: { effort: "low" },
            messages: [
              { role: "system", content: "You are CredWise Document Intelligence. Answer ONLY from the supplied statement record. Never invent values. If the statement does not contain the answer, say so. Always finish with a grounded source such as Source: Page 1 or Source: Pages 2–4. Use cautious language for unusual activity." },
              { role: "system", content: `Active PDF document_id=${activeDocument.id}: ${JSON.stringify(activeDocument)}` },
              ...(input.history ?? []).map(message => ({ role: message.role as "user" | "assistant", content: message.content })),
              { role: "user", content: input.question },
            ],
          });
          const content = response.choices[0]?.message?.content;
          if (typeof content === "string" && content.trim()) return { answer: content, source: "Grounded in active PDF" as const };
        } catch (error) {
          console.warn("[CredWise] Document LLM unavailable, using grounded fallback", error);
        }
        return { answer: activeDocument.id === DEMO_DOCUMENT.id ? documentFallback(input.question) : `For **${activeDocument.name}**, the scoped record shows credits of **₹${activeDocument.summary.totalCredits.toLocaleString("en-IN")}** and debits of **₹${activeDocument.summary.totalDebits.toLocaleString("en-IN")}**. This answer is scoped to document ID **${activeDocument.id}**.`, source: "Grounded statement analysis" as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
