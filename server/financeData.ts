export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  status: "posted" | "review";
  note?: string;
};

export type Holding = {
  name: string;
  symbol: string;
  type: "Stock" | "Mutual fund" | "ETF" | "FD" | "Gold" | "NPS";
  invested: number;
  current: number;
  returnPct: number;
  allocation: number;
  risk: "Low" | "Moderate" | "High";
};

export type FinancialProfile = {
  user: { name: string; initials: string; location: string };
  summary: {
    netWorth: number;
    netWorthChange: number;
    liquidCash: number;
    runwayMonths: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySurplus: number;
    creditScore: number;
    creditUtilization: number;
  };
  cashFlow: Array<{ month: string; income: number; expenses: number; savings: number }>;
  accounts: Array<{ name: string; institution: string; type: string; balance: number; lastUpdated: string }>;
  transactions: Transaction[];
  holdings: Holding[];
  debts: Array<{ name: string; lender: string; balance: number; emi: number; rate: number; dueDate: string; priority: "High" | "Medium" | "Low" }>;
  goals: Array<{ name: string; target: number; saved: number; due: string; status: "On track" | "Watch" | "At risk" }>;
  insights: Array<{ label: string; title: string; detail: string; tone: "positive" | "attention" | "neutral" }>;
};

export const DEMO_PROFILE: FinancialProfile = {
  user: { name: "CredWise Member", initials: "CW", location: "India" },
  summary: {
    netWorth: 4286500,
    netWorthChange: 7.4,
    liquidCash: 834200,
    runwayMonths: 6.2,
    monthlyIncome: 238000,
    monthlyExpenses: 127580,
    monthlySurplus: 68420,
    creditScore: 742,
    creditUtilization: 18,
  },
  cashFlow: [
    { month: "Apr", income: 218000, expenses: 131400, savings: 86600 },
    { month: "May", income: 224000, expenses: 124600, savings: 99400 },
    { month: "Jun", income: 231000, expenses: 129100, savings: 101900 },
    { month: "Jul", income: 238000, expenses: 122800, savings: 115200 },
    { month: "Aug", income: 238000, expenses: 127580, savings: 110420 },
    { month: "Sep", income: 238000, expenses: 127580, savings: 110420 },
  ],
  accounts: [
    { name: "Primary savings", institution: "HDFC Bank", type: "Savings", balance: 584200, lastUpdated: "8 min ago" },
    { name: "Salary account", institution: "ICICI Bank", type: "Savings", balance: 250000, lastUpdated: "8 min ago" },
    { name: "Liquid reserve", institution: "Axis Bank", type: "Sweep FD", balance: 120000, lastUpdated: "Yesterday" },
  ],
  transactions: [
    { id: "txn_01", merchant: "Salary · Mehta Labs", category: "Income", date: "Today, 09:02", amount: 238000, type: "income", status: "posted" },
    { id: "txn_02", merchant: "Amazon India", category: "Shopping", date: "Yesterday, 18:42", amount: 12480, type: "expense", status: "review", note: "Larger than your usual shopping transaction" },
    { id: "txn_03", merchant: "Rent · Koramangala", category: "Housing", date: "Sep 01, 08:30", amount: 42000, type: "expense", status: "posted" },
    { id: "txn_04", merchant: "Groww SIP · Index fund", category: "Investments", date: "Sep 01, 08:00", amount: 25000, type: "expense", status: "posted" },
    { id: "txn_05", merchant: "Swiggy", category: "Food & dining", date: "Aug 31, 21:16", amount: 1640, type: "expense", status: "posted" },
    { id: "txn_06", merchant: "Bengaluru Electricity", category: "Utilities", date: "Aug 29, 10:12", amount: 2860, type: "expense", status: "posted" },
    { id: "txn_07", merchant: "Vistara", category: "Travel", date: "Aug 27, 15:04", amount: 18400, type: "expense", status: "posted" },
  ],
  holdings: [
    { name: "Nifty 50 Index Fund", symbol: "UTI NIFTY", type: "Mutual fund", invested: 680000, current: 812400, returnPct: 19.5, allocation: 28, risk: "Moderate" },
    { name: "HDFC Bank", symbol: "HDFCBANK", type: "Stock", invested: 420000, current: 466800, returnPct: 11.1, allocation: 16, risk: "Moderate" },
    { name: "Nasdaq 100 ETF", symbol: "MON100", type: "ETF", invested: 310000, current: 376100, returnPct: 21.3, allocation: 13, risk: "High" },
    { name: "SBI Bluechip Fund", symbol: "SBI BLUE", type: "Mutual fund", invested: 260000, current: 285800, returnPct: 9.9, allocation: 10, risk: "Moderate" },
    { name: "Tax saver FD", symbol: "HDFC FD", type: "FD", invested: 400000, current: 445600, returnPct: 11.4, allocation: 15, risk: "Low" },
    { name: "Digital gold", symbol: "GOLD", type: "Gold", invested: 160000, current: 198400, returnPct: 24, allocation: 7, risk: "Moderate" },
    { name: "NPS Tier I", symbol: "NPS", type: "NPS", invested: 180000, current: 201500, returnPct: 11.9, allocation: 7, risk: "Moderate" },
  ],
  debts: [
    { name: "Home loan", lender: "HDFC Ltd", balance: 3120000, emi: 38500, rate: 8.65, dueDate: "05 Oct", priority: "Medium" },
    { name: "Education loan", lender: "SBI", balance: 482000, emi: 9800, rate: 10.4, dueDate: "10 Oct", priority: "High" },
    { name: "Credit card", lender: "Amex", balance: 28600, emi: 4200, rate: 36, dueDate: "18 Sep", priority: "High" },
  ],
  goals: [
    { name: "Home upgrade", target: 2500000, saved: 1340000, due: "Dec 2028", status: "On track" },
    { name: "Emergency fund", target: 900000, saved: 834200, due: "Dec 2026", status: "Watch" },
    { name: "Japan trip", target: 220000, saved: 164000, due: "Apr 2027", status: "On track" },
  ],
  insights: [
    { label: "Good momentum", title: "Your savings rate is 28.7%", detail: "You are saving above the 25% target for your income band.", tone: "positive" },
    { label: "Review soon", title: "One transaction looks unusual", detail: "Amazon spend is 3.2× your 90-day shopping average.", tone: "attention" },
    { label: "Portfolio", title: "Equity is 67% of investments", detail: "That is aligned with your long-term horizon, but worth revisiting before the home upgrade.", tone: "neutral" },
  ],
};

export function financialSnapshot() {
  const s = DEMO_PROFILE.summary;
  const totalInvested = DEMO_PROFILE.holdings.reduce((sum, holding) => sum + holding.current, 0);
  const totalDebt = DEMO_PROFILE.debts.reduce((sum, debt) => sum + debt.balance, 0);
  return {
    profile: DEMO_PROFILE,
    metrics: {
      totalInvested,
      totalDebt,
      savingsRate: Math.round((s.monthlySurplus / s.monthlyIncome) * 1000) / 10,
      totalAssets: s.netWorth + totalDebt,
      expenseRatio: Math.round((s.monthlyExpenses / s.monthlyIncome) * 1000) / 10,
    },
  };
}

export function answerDeterministically(question: string) {
  const q = question.toLowerCase();
  const s = DEMO_PROFILE.summary;
  const snapshot = financialSnapshot();
  const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  if (q.includes("net worth") || q.includes("financially healthy")) {
    return `Your current net worth is **${money(s.netWorth)}**. Your profile looks resilient: a **${snapshot.metrics.savingsRate}% monthly savings rate**, **${s.runwayMonths} months of cash runway**, and **${s.creditScore} credit score**. The main thing to watch is concentration: equities are 67% of your investment portfolio while you are also saving for a home upgrade.`;
  }
  if (q.includes("save") && (q.includes("month") || q.includes("saving enough"))) {
    return `You are currently saving about **${money(s.monthlySurplus)} per month**, or **${snapshot.metrics.savingsRate}% of monthly income**. That is above the 25% target I use as a planning benchmark. Your last six months show a consistent surplus, which is a stronger signal than any single month.`;
  }
  if (q.includes("credit") || q.includes("utilization")) {
    return `Your credit score is **${s.creditScore}** and card utilization is **${s.creditUtilization}%**. That is a healthy utilization level. The priority is the Amex balance because its **36% stated rate** is materially higher than your other debt.`;
  }
  if (q.includes("investment") || q.includes("stock") || q.includes("mutual") || q.includes("portfolio")) {
    return `Your portfolio is worth approximately **${money(snapshot.metrics.totalInvested)}** today. The strongest return in this sample is Digital Gold at **24%**, followed by the Nasdaq 100 ETF at **21.3%**. Equities and equity funds make up 67% of the portfolio, so your allocation is growth-oriented rather than conservative.`;
  }
  if (q.includes("loan") || q.includes("debt")) {
    return `You have **${money(snapshot.metrics.totalDebt)}** across three obligations. I would prioritize the Amex card first because of its 36% rate, then compare accelerated repayment of the education loan at 10.4% against your expected after-tax investment return. The home loan is lower-cost debt and can remain on schedule while liquidity stays important.`;
  }
  if (q.includes("unusual") || q.includes("suspicious")) {
    return `One transaction appears unusual and may warrant review: **Amazon India, ${money(12480)}**, which is about 3.2× your 90-day shopping average. This is a review signal, not a fraud determination. Confirm it was yours before taking any action.`;
  }
  if (q.includes("car") || q.includes("afford")) {
    return `Based on the current snapshot, a ₹5 lakh car is potentially affordable, but the down payment matters. You have ${money(s.liquidCash)} in liquid cash and ${s.runwayMonths} months of runway. I would avoid reducing that reserve below six months of expenses; a ₹2 lakh down payment leaves roughly ${money(s.liquidCash - 200000)} before fees, which keeps you near that threshold. The exact recommendation depends on the loan rate and tenure.`;
  }
  if (q.includes("transaction")) {
    return `Your latest activity includes salary credit of ${money(238000)}, rent of ${money(42000)}, a ${money(25000)} SIP, and an Amazon purchase of ${money(12480)} flagged for review. Ask “show my expenses by category” or “what looks unusual?” for a deeper view.`;
  }
  return `I can reason over your connected profile, including cash flow, investments, debt, credit, goals, transactions, and what-if scenarios. I do not see enough information to answer that precisely yet, so try asking about affordability, savings, portfolio performance, debt priorities, unusual activity, or a specific goal.`;
}
