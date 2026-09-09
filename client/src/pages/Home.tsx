import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import DocumentReview from "@/components/DocumentReview";
import type { FinancialProfile } from "../../../server/financeData";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BrainCircuit, BriefcaseBusiness, Building2,
  CalendarDays, CarFront, Check, ChevronDown, ChevronRight, CircleAlert, CreditCard, FileText, Landmark, LayoutDashboard,
  LineChart, Menu, MessageCircle, MoreHorizontal, PiggyBank, Plus, ReceiptText, Search, Send, Settings2,
  ShieldCheck, Sparkles, Target, TrendingUp, Upload, WalletCards, X, Zap,
} from "lucide-react";

const money = (value: number, compact = false) => compact
  ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "INR" }).format(value)
  : `₹${Math.round(value).toLocaleString("en-IN")}`;
const pct = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

type Section = "Overview" | "Transactions" | "Investments" | "Credit & debt" | "Goals";

function Sparkline({ values, color = "#22c55e" }: { values: number[]; color?: string }) {
  const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${35 - ((value - min) / range) * 28}`).join(" ");
  return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full overflow-visible"><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Progress({ value, tone = "mint" }: { value: number; tone?: "mint" | "amber" | "violet" }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[#edf1eb]"><div className={`h-full rounded-full ${tone === "amber" ? "bg-[#e7a952]" : tone === "violet" ? "bg-[#8878dc]" : "bg-[#39b876]"}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function AppMark() {
  return <div className="app-mark"><span className="app-mark-dot" /><span className="app-mark-line" /><span className="app-mark-dot small" /></div>;
}

function Login() {
  return <div className="login-screen"><div className="login-art"><div className="login-art-grid" /><div className="login-quote"><Sparkles size={17} /><p>“The clearest view of your financial life is the one that connects everything.”</p><span>CredWise Intelligence</span></div></div><div className="login-panel"><div className="login-brand"><AppMark /><div><b>credwise<span>.</span></b><small>intelligent money</small></div></div><div className="login-copy"><p className="eyebrow mint-eyebrow">SECURE WORKSPACE</p><h1>Your entire financial life.<br /><em>One intelligent advisor.</em></h1><p>Sign in to access your connected financial picture, documents, goals, and private AI advisor.</p></div><button className="oauth-btn" onClick={() => startLogin()}><ShieldCheck size={17} /> Continue with secure login <ArrowUpRight size={15} /></button><div className="login-divider"><span>Protected by Manus OAuth</span></div><div className="demo-note"><ShieldCheck size={16} /><span><b>Secure sign-in</b><small>Your session is encrypted and your financial workspace is private.</small></span></div><p className="login-foot">This prototype uses synthetic demo data. Do not enter real banking credentials.</p></div></div>;
}

export default function Home() {
  const auth = useAuth();
  const { data, isLoading, error } = trpc.finance.profile.useQuery(undefined, { enabled: auth.isAuthenticated });
  const ask = trpc.finance.ask.useMutation();
  const [section, setSection] = useState<Section>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; source?: string }>>([]);
  const [scenario, setScenario] = useState({ price: 500000, downPayment: 200000, rate: 10.5, years: 5 });
  const [showSimulator, setShowSimulator] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentConfirmed, setDocumentConfirmed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const simInput = useMemo(() => ({ price: scenario.price, downPayment: scenario.downPayment, annualRate: scenario.rate, years: scenario.years }), [scenario]);
  const { data: simulation } = trpc.finance.simulate.useQuery(simInput, { enabled: showSimulator });
  const profile = data?.profile;
  const summary = profile?.summary;
  const displayName = auth.user?.name?.trim() || profile?.user.name || "User";
  const firstName = displayName.split(/\s+/)[0] || "User";
  const initials = auth.user?.name?.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || profile?.user.initials || "U";

  useEffect(() => {
    if (auth.isAuthenticated && messages.length === 0) setMessages([{ role: "assistant", content: `Good morning, ${firstName}. I’ve reviewed your latest money picture. What would you like to understand today?`, source: "CredWise Intelligence" }]);
  }, [auth.isAuthenticated, firstName, messages.length]);
  useEffect(() => {
    if (!auth.isAuthenticated && !auth.loading) {
      setMessages([]);
      setQuestion("");
      setShowDocument(false);
      setProfileOpen(false);
      setShowSettings(false);
      try { localStorage.removeItem("credwise-active-document"); sessionStorage.removeItem("credwise-chat-context"); } catch {}
    }
  }, [auth.isAuthenticated, auth.loading]);

  const sendQuestion = async (text = question) => {
    const trimmed = text.trim(); if (!trimmed || ask.isPending) return;
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages); setQuestion("");
    try {
      const response = await ask.mutateAsync({ question: trimmed, history: messages.slice(-8).map(({ role, content }) => ({ role, content })) });
      setMessages([...nextMessages, { role: "assistant", content: response.answer, source: response.source }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "I couldn’t reach the advisor right now. Your local profile is still available to explore; please try again in a moment." }]);
    }
  };

  if (auth.loading) return <div className="loading-screen"><div className="loading-orb"><Sparkles size={22} /></div><p>Checking your secure session…</p></div>;
  if (!auth.isAuthenticated) return <Login />;
  if (isLoading || !profile || !summary) return <div className="loading-screen"><div className="loading-orb"><Sparkles size={22} /></div><p>Building your financial picture…</p></div>;
  if (error) return <div className="loading-screen"><CircleAlert size={28} /><p>Unable to load the demo financial profile.</p></div>;

  const navItems: Array<{ label: Section; icon: typeof LayoutDashboard }> = [
    { label: "Overview", icon: LayoutDashboard }, { label: "Transactions", icon: ReceiptText }, { label: "Investments", icon: LineChart }, { label: "Credit & debt", icon: CreditCard }, { label: "Goals", icon: Target },
  ];
  const quickPrompts = ["Am I financially healthy?", "Which debt should I prioritize?", "What looks unusual?", "How are my investments doing?"];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand-row"><AppMark /><div><div className="brand-name">credwise<span>.</span></div><div className="brand-sub">intelligent money</div></div><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-list">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setSection(label); setMobileOpen(false); }} className={`nav-item ${section === label ? "active" : ""}`}><Icon size={17} strokeWidth={section === label ? 2.4 : 1.8} /><span>{label}</span>{label === "Transactions" && <span className="nav-badge">1</span>}</button>)}</nav>
      <div className="workspace-label second">TOOLS</div>
      <button className="nav-item" onClick={() => setShowSimulator(true)}><Zap size={17} /><span>What-if simulator</span></button>
      <button className="nav-item" onClick={() => setShowDocument(true)}><FileText size={17} /><span>Document review</span></button>
      <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={16} /><span>Your data is private<br /><b>Last synced 8 min ago</b></span></div><button className="nav-item" onClick={() => setShowSettings(true)}><Settings2 size={17} /><span>Settings</span></button><div className="profile-chip"><div className="avatar">{initials}</div><div><b>{displayName}</b><span>{auth.user?.email ?? "Personal workspace"}</span></div><ChevronDown size={15} className="muted" /></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Personal workspace</span><span className="slash">/</span><b>{section}</b></div><div className="top-actions"><div className="sync-state"><span className="sync-dot" />All accounts synced</div><button className="icon-btn"><Search size={18} /></button><button className="icon-btn notification"><Bell size={18} /><i /></button><div className="profile-menu-wrap"><button className="top-avatar" onClick={() => setProfileOpen(!profileOpen)}>{profile.user.initials}</button>{profileOpen && <div className="profile-menu"><div className="profile-menu-head"><div className="avatar">{profile.user.initials}</div><div><b>{auth.user?.name ?? profile.user.name}</b><span>{auth.user?.email ?? "Private workspace"}</span></div></div><button onClick={() => setProfileOpen(false)}>Profile <ChevronRight size={14} /></button><button onClick={() => setProfileOpen(false)}>Settings <ChevronRight size={14} /></button><button className="logout-item" onClick={() => auth.logout()}>Log out <ArrowUpRight size={14} /></button></div>}</div></div></header>
      <div className="content-wrap">
        <section className="welcome-row"><div><p className="eyebrow">TUESDAY, 09 SEPTEMBER 2026</p><h1>Good morning, {firstName} <span className="wave">✦</span></h1><p className="lede">Here’s the clearest view of your financial life today.</p></div><button className="add-btn" onClick={() => setShowDocument(true)}><Plus size={16} /> Add financial data</button></section>

        {section === "Overview" && <>
          <section className="metric-grid">
            <div className="metric-card primary"><div className="metric-top"><span>Net worth</span><MoreHorizontal size={17} /></div><div className="metric-value">{money(summary.netWorth, true)}</div><div className="metric-change positive"><ArrowUpRight size={14} /> {pct(summary.netWorthChange)} <span>vs last month</span></div><div className="spark-wrap"><Sparkline values={[3.2, 3.5, 3.42, 3.85, 4.02, 4.28]} /></div></div>
            <div className="metric-card"><div className="metric-top"><span>Liquid cash</span><WalletCards size={17} /></div><div className="metric-value">{money(summary.liquidCash, true)}</div><div className="metric-caption"><span className="status-dot mint" />{summary.runwayMonths} months runway</div><div className="mini-bars"><span style={{ height: "45%" }} /><span style={{ height: "58%" }} /><span style={{ height: "52%" }} /><span style={{ height: "74%" }} /><span style={{ height: "67%" }} /><span className="current" style={{ height: "86%" }} /></div></div>
            <div className="metric-card"><div className="metric-top"><span>Monthly surplus</span><PiggyBank size={17} /></div><div className="metric-value">{money(summary.monthlySurplus, true)}</div><div className="metric-change positive"><ArrowUpRight size={14} /> 11.8% <span>vs 3-month avg</span></div><div className="metric-foot"><span>Income {money(summary.monthlyIncome, true)}</span><span>Expenses {money(summary.monthlyExpenses, true)}</span></div><Progress value={summary.monthlySurplus / summary.monthlyIncome * 100} /></div>
            <div className="metric-card"><div className="metric-top"><span>Credit health</span><CreditCard size={17} /></div><div className="metric-value">{summary.creditScore}<span className="score-denom">/ 900</span></div><div className="credit-bar"><span style={{ width: `${summary.creditScore / 9}%` }} /></div><div className="metric-foot"><span>Utilization <b>{summary.creditUtilization}%</b></span><span className="positive-text">Excellent</span></div></div>
          </section>

          <section className="dashboard-grid">
            <div className="panel cashflow-panel"><div className="panel-heading"><div><p className="eyebrow">MONEY IN / MONEY OUT</p><h2>Cash flow</h2></div><button className="select-btn">Last 6 months <ChevronDown size={14} /></button></div><div className="cashflow-legend"><span><i className="legend income" />Income</span><span><i className="legend expense" />Expenses</span><strong>{money(profile.cashFlow[profile.cashFlow.length - 1].savings)} saved this month</strong></div><div className="chart-area"><div className="chart-y"><span>₹250k</span><span>₹175k</span><span>₹100k</span><span>₹25k</span></div><div className="chart-main"><div className="grid-lines"><i /><i /><i /><i /></div><div className="bars">{profile.cashFlow.map((month, index) => <div className="bar-group" key={month.month}><div className="bar income" style={{ height: `${month.income / 250000 * 100}%` }} /><div className="bar expense" style={{ height: `${month.expenses / 250000 * 100}%` }} /><span>{month.month}</span>{index === profile.cashFlow.length - 1 && <em>Now</em>}</div>)}</div></div></div></div>
            <div className="panel intelligence-panel"><div className="intelligence-glow" /><div className="panel-heading relative"><div><p className="eyebrow mint-eyebrow"><Sparkles size={12} /> CREDWISE INTELLIGENCE</p><h2>Your intelligent advisor</h2></div><span className="live-pill"><i /> Live</span></div><div className="advisor-summary"><div className="advisor-icon"><BrainCircuit size={21} /></div><div><b>Your financial picture is healthy</b><p>Strong surplus and consistent investing. I found one item worth your attention.</p></div></div><div className="attention-row"><div className="attention-icon"><CircleAlert size={16} /></div><div><b>One transaction needs a look</b><span>Amazon · {money(12480)} · Yesterday</span></div><button onClick={() => { setSection("Transactions"); }}>Review <ArrowUpRight size={14} /></button></div><button className="ask-cta" onClick={() => document.getElementById("advisor-input")?.focus()}>Ask me anything <MessageCircle size={16} /></button></div>
          </section>

          <section className="lower-grid"><div className="panel insights-panel"><div className="panel-heading"><div><p className="eyebrow">PERSONALIZED FOR YOU</p><h2>Signals & insights</h2></div><button className="text-btn">View all <ArrowUpRight size={14} /></button></div><div className="insight-list">{profile.insights.map((insight, index) => <div className="insight-row" key={insight.title}><div className={`signal-icon ${insight.tone}`}>{insight.tone === "positive" ? <TrendingUp size={17} /> : insight.tone === "attention" ? <CircleAlert size={17} /> : <Activity size={17} />}</div><div className="insight-copy"><span className={`signal-label ${insight.tone}`}>{insight.label}</span><b>{insight.title}</b><p>{insight.detail}</p></div><span className="insight-number">0{index + 1}</span></div>)}</div></div><div className="panel goals-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PLAN</p><h2>Goal progress</h2></div><button className="icon-btn"><MoreHorizontal size={17} /></button></div><div className="goal-list">{profile.goals.map((goal, index) => <div className="goal-item" key={goal.name}><div className="goal-icon">{index === 0 ? <Building2 size={17} /> : index === 1 ? <ShieldCheck size={17} /> : <BriefcaseBusiness size={17} />}</div><div className="goal-info"><div><b>{goal.name}</b><span className={`goal-status ${goal.status === "Watch" ? "watch" : ""}`}>{goal.status}</span></div><Progress value={goal.saved / goal.target * 100} tone={index === 1 ? "amber" : index === 2 ? "violet" : "mint"} /><small>{money(goal.saved)} <em>of {money(goal.target)}</em></small></div><span className="goal-pct">{Math.round(goal.saved / goal.target * 100)}%</span></div>)}</div></div></section>
        </>}

        {section === "Transactions" && <Transactions profile={profile} onReview={() => setShowDocument(true)} />}
        {section === "Investments" && <Investments profile={profile} />}
        {section === "Credit & debt" && <Debt profile={profile} />}
        {section === "Goals" && <Goals profile={profile} />}

        <section className="advisor-section" id="advisor"><div className="advisor-header"><div><p className="eyebrow mint-eyebrow"><Sparkles size={12} /> CREDWISE INTELLIGENCE</p><h2>Ask anything about your money</h2><p>One advisor for your entire financial life — not a collection of disconnected tools.</p></div><div className="advisor-badge"><ShieldCheck size={15} /> Profile-based answers</div></div><div className="chat-box"><div className="chat-messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}><div className={`chat-avatar ${message.role}`}>{message.role === "assistant" ? <Sparkles size={15} /> : profile.user.initials}</div><div className="chat-bubble"><Streamdown>{message.content}</Streamdown>{message.source && <span className="chat-source"><span className="sync-dot" /> {message.source}</span>}</div></div>)}{ask.isPending && <div className="chat-message assistant"><div className="chat-avatar assistant"><Sparkles size={15} /></div><div className="chat-bubble typing"><i /><i /><i /></div></div>}</div><div className="prompt-row">{quickPrompts.map(prompt => <button key={prompt} onClick={() => sendQuestion(prompt)}>{prompt}</button>)}</div><div className="chat-input-row"><input id="advisor-input" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter") sendQuestion(); }} placeholder="Ask CredWise anything… e.g. Can I afford a ₹5 lakh car?" /><button className="mic-btn" aria-label="Voice input"><Activity size={17} /></button><button className="send-btn" onClick={() => sendQuestion()} disabled={!question.trim() || ask.isPending}><Send size={16} /></button></div><div className="chat-disclaimer"><ShieldCheck size={13} /> Answers use your connected data and clearly label assumptions. Not investment advice.</div></div></section>
      </div>
    </main>

    {showSimulator && <div className="modal-backdrop" onClick={() => setShowSimulator(false)}><div className="modal-card simulator-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow mint-eyebrow"><Zap size={12} /> SCENARIO PLANNER</p><h2>What if I buy a car?</h2><p>See how a decision changes your liquidity and monthly surplus.</p></div><button className="icon-btn" onClick={() => setShowSimulator(false)}><X size={18} /></button></div><div className="scenario-fields"><label>Car price<input type="number" value={scenario.price} onChange={e => setScenario({ ...scenario, price: Number(e.target.value) })} /></label><label>Down payment<input type="number" value={scenario.downPayment} onChange={e => setScenario({ ...scenario, downPayment: Number(e.target.value) })} /></label><label>Interest rate<input type="number" step="0.1" value={scenario.rate} onChange={e => setScenario({ ...scenario, rate: Number(e.target.value) })} /></label><label>Loan tenure<select value={scenario.years} onChange={e => setScenario({ ...scenario, years: Number(e.target.value) })}><option value={3}>3 years</option><option value={5}>5 years</option><option value={7}>7 years</option></select></label></div>{simulation && <div className="scenario-result"><div className="scenario-verdict"><div className="verdict-icon"><CarFront size={20} /></div><div><span>PLANNING SIGNAL</span><b>{simulation.verdict}</b></div></div><div className="scenario-stats"><div><span>Estimated EMI</span><b>{money(simulation.emi)}<small>/mo</small></b></div><div><span>Cash after down payment</span><b>{money(simulation.remainingCash)}</b></div><div><span>New monthly surplus</span><b className={simulation.newSurplus < 0 ? "negative" : ""}>{money(simulation.newSurplus)}</b></div><div><span>Runway after purchase</span><b>{simulation.runwayMonths} months</b></div></div></div>}<div className="modal-foot"><span><ShieldCheck size={14} /> Deterministic calculation · no return assumptions</span><button className="primary-btn" onClick={() => { setShowSimulator(false); sendQuestion(`What happens if I buy a car for ${money(scenario.price)} with ${money(scenario.downPayment)} down?`); }}>Discuss with advisor <ArrowUpRight size={14} /></button></div></div></div>}

    {showDocument && <DocumentReview onClose={() => setShowDocument(false)} />}
    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="modal-card settings-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow mint-eyebrow"><Settings2 size={12} /> WORKSPACE SETTINGS</p><h2>Settings</h2><p>Manage your account and privacy preferences.</p></div><button className="icon-btn" onClick={() => setShowSettings(false)}><X size={18} /></button></div><div className="settings-list"><div><span>Account</span><b>{auth.user?.name ?? profile.user.name}</b><small>{auth.user?.email ?? "Authenticated workspace"}</small></div><div><span>Security</span><b>Secure OAuth session</b><small>Password management is handled by the secure identity provider.</small></div><div><span>Notifications</span><b>Coming Soon</b><small>Notification controls will be available in a future update.</small></div><div><span>Data & privacy</span><b>Synthetic demo data</b><small>Your current workspace uses clearly labeled synthetic financial data.</small></div></div><div className="modal-foot"><span><ShieldCheck size={14} /> Your session is protected.</span><button className="secondary-btn" onClick={() => setShowSettings(false)}>Done</button></div></div></div>}
  </div>;
}

function Transactions({ profile, onReview }: { profile: FinancialProfile; onReview: () => void }) {
  return <section className="full-section"><div className="section-title-row"><div><p className="eyebrow">MONEY MOVEMENT</p><h2>Transactions</h2><p>Recent activity across your connected accounts.</p></div><button className="add-btn" onClick={onReview}><Upload size={16} /> Import statement</button></div><div className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={15} /><input placeholder="Search merchants or categories" /></div><button className="select-btn">All categories <ChevronDown size={14} /></button><button className="select-btn">This month <ChevronDown size={14} /></button></div><div className="data-table"><div className="table-row table-head"><span>Merchant</span><span>Category</span><span>Date</span><span>Amount</span><span>Status</span></div>{profile.transactions.map(transaction => <div className="table-row" key={transaction.id}><span className="merchant-cell"><div className={`merchant-icon ${transaction.type}`}><Landmark size={15} /></div><b>{transaction.merchant}</b></span><span>{transaction.category}</span><span>{transaction.date}</span><span className={transaction.type === "income" ? "positive-text" : "amount-cell"}>{transaction.type === "income" ? "+" : "−"}{money(transaction.amount)}</span><span>{transaction.status === "review" ? <span className="review-pill"><CircleAlert size={12} /> Review</span> : <span className="posted-pill">Posted</span>}</span></div>)}</div></div></section>;
}

function Investments({ profile }: { profile: FinancialProfile }) {
  const total = profile.holdings.reduce((sum, item) => sum + item.current, 0); return <section className="full-section"><div className="section-title-row"><div><p className="eyebrow">GROWTH & ALLOCATION</p><h2>Investments</h2><p>Portfolio performance across stocks, funds and fixed income.</p></div><button className="add-btn"><Plus size={16} /> Add investment</button></div><div className="investment-overview"><div className="panel invest-total"><p className="eyebrow">PORTFOLIO VALUE</p><h3>{money(total)}</h3><div className="metric-change positive"><ArrowUpRight size={14} /> +16.2% <span>all time</span></div><div className="allocation-ring"><div><b>67%</b><span>Equity</span></div></div></div><div className="panel allocation-panel"><div className="panel-heading"><div><p className="eyebrow">ALLOCATION</p><h2>Where your money is</h2></div></div><div className="allocation-bars"><div><span><i className="alloc equity" />Equity</span><b>67%</b></div><Progress value={67} /><div><span><i className="alloc fixed" />Fixed income</span><b>15%</b></div><Progress value={15} tone="amber" /><div><span><i className="alloc gold" />Gold & alternatives</span><b>18%</b></div><Progress value={18} tone="violet" /></div></div></div><div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">HOLDINGS</p><h2>Investment detail</h2></div><button className="select-btn">All types <ChevronDown size={14} /></button></div><div className="data-table"><div className="table-row table-head"><span>Holding</span><span>Type</span><span>Invested</span><span>Current value</span><span>Return</span></div>{profile.holdings.map(item => <div className="table-row" key={item.symbol}><span className="merchant-cell"><div className="fund-icon"><BarChart3 size={15} /></div><div><b>{item.name}</b><small>{item.symbol}</small></div></span><span>{item.type}</span><span>{money(item.invested)}</span><span>{money(item.current)}</span><span className="positive-text">{pct(item.returnPct)}</span></div>)}</div></div></section>;
}

function Debt({ profile }: { profile: FinancialProfile }) { return <section className="full-section"><div className="section-title-row"><div><p className="eyebrow">BORROWING & CREDIT</p><h2>Credit & debt</h2><p>Keep expensive debt visible and your credit profile healthy.</p></div><div className="credit-score-card"><ShieldCheck size={17} /><span>Credit score</span><b>{profile.summary.creditScore}</b></div></div><div className="debt-grid">{profile.debts.map(debt => <div className="panel debt-card" key={debt.name}><div className="debt-card-top"><div className="debt-icon"><CreditCard size={18} /></div><span className={`priority ${debt.priority.toLowerCase()}`}>{debt.priority} priority</span></div><h3>{debt.name}</h3><p>{debt.lender}</p><div className="debt-balance">{money(debt.balance)}</div><div className="debt-meta"><span>EMI <b>{money(debt.emi)}</b></span><span>Rate <b className={debt.rate > 20 ? "negative" : ""}>{debt.rate}%</b></span></div><div className="debt-footer"><span>Next due {debt.dueDate}</span><button className="text-btn">Plan payoff <ArrowUpRight size={14} /></button></div></div>)}</div><div className="panel recommendation"><div className="advisor-icon"><BrainCircuit size={20} /></div><div><p className="eyebrow mint-eyebrow">CREDWISE RECOMMENDATION</p><h3>Clear the Amex balance before adding new investments</h3><p>At 36%, the interest cost is a more certain drag than expected market returns. Your current cash buffer can cover it without dropping below six months of runway.</p></div><button className="secondary-btn">Explore payoff plan</button></div></section>; }

function Goals({ profile }: { profile: FinancialProfile }) { return <section className="full-section"><div className="section-title-row"><div><p className="eyebrow">FUTURE YOU</p><h2>Your goals</h2><p>Connect today’s choices to the life you are building.</p></div><button className="add-btn"><Plus size={16} /> Add a goal</button></div><div className="goal-cards">{profile.goals.map((goal, index) => <div className="panel big-goal" key={goal.name}><div className={`big-goal-icon tone-${index}`}><Target size={20} /></div><div className="big-goal-head"><div><h3>{goal.name}</h3><span>Target by {goal.due}</span></div><span className={`goal-status ${goal.status === "Watch" ? "watch" : ""}`}>{goal.status}</span></div><div className="big-goal-amount"><b>{money(goal.saved)}</b><span>of {money(goal.target)}</span></div><Progress value={goal.saved / goal.target * 100} tone={index === 1 ? "amber" : index === 2 ? "violet" : "mint"} /><div className="goal-bottom"><span>{Math.round(goal.saved / goal.target * 100)}% complete</span><span>{money(goal.target - goal.saved)} to go</span></div></div>)}</div></section>; }
