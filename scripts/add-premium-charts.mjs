import fs from "node:fs";
const path = "/home/ubuntu/credwise-ai/client/src/pages/Home.tsx";
let text = fs.readFileSync(path, "utf8");
const anchor = `function Progress({ value, tone = "mint" }: { value: number; tone?: "mint" | "amber" | "violet" }) {`;
const insert = `
function PremiumCashflow({ data }: { data: FinancialProfile["cashFlow"] }) {
  const max = Math.max(...data.flatMap(item => [item.income, item.expenses]));
  const points = (key: "income" | "expenses") => data.map((item, index) => `${(index / Math.max(data.length - 1, 1)) * 100},${92 - (item[key] / max) * 78}`).join(" ");
  return <div className="premium-chart-shell"><div className="premium-chart-legend"><span><i className="chart-dot income" />Income</span><span><i className="chart-dot expense" />Expenses</span><span className="chart-savings">{money(data[data.length - 1]?.savings ?? 0)} saved</span></div><svg className="premium-line-chart" viewBox="0 0 100 112" preserveAspectRatio="none" role="img" aria-label="Monthly income and expenses"><defs><linearGradient id="income-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#63c993" stopOpacity=".22" /><stop offset="1" stopColor="#63c993" stopOpacity="0" /></linearGradient></defs><path d={`M 0,100 L ${points("income")} L 100,100 Z`} fill="url(#income-fill)" /><polyline points={points("income")} fill="none" stroke="#46b97b" strokeWidth="1.8" vectorEffect="non-scaling-stroke" /><polyline points={points("expenses")} fill="none" stroke="#bd91c9" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 2" />{data.map((item, index) => <g key={item.month}><circle cx={`${(index / Math.max(data.length - 1, 1)) * 100}`} cy={`${92 - (item.income / max) * 78}`} r="1.8" fill="#fff" stroke="#46b97b" strokeWidth="1" /><title>{`${item.month}: Income ${money(item.income)} · Expenses ${money(item.expenses)} · Savings ${money(item.savings)}`}</title></g>)}</svg><div className="premium-chart-labels">{data.map(item => <span key={item.month}>{item.month}</span>)}</div></div>;
}

function PremiumAllocation({ holdings }: { holdings: FinancialProfile["holdings"] }) {
  const total = holdings.reduce((sum, item) => sum + item.current, 0);
  const groups = holdings.reduce<Record<string, number>>((acc, item) => { const key = item.type === "Mutual fund" ? "Mutual funds" : item.type === "FD" ? "FD / RD" : item.type; acc[key] = (acc[key] ?? 0) + item.current; return acc; }, {});
  const colors = ["#43b97a", "#8b82dc", "#d59b55", "#6c9fd1", "#b47cc1", "#86a878"];
  return <div className="premium-allocation">{Object.entries(groups).sort(([, a], [, b]) => b - a).map(([name, value], index) => <div className="allocation-row-premium" key={name}><span><i style={{ background: colors[index % colors.length] }} />{name}</span><div className="allocation-track-premium"><i style={{ width: `${(value / total) * 100}%`, background: colors[index % colors.length] }} /></div><b>{money(value)}</b><small>{Math.round((value / total) * 100)}%</small></div>)}</div>;
}

`;
if (!text.includes("function PremiumCashflow")) text = text.replace(anchor, insert + anchor);
text = text.replace(/<div className="chart-area">.*?<\/div><\/div><\/div>/s, "<PremiumCashflow data={profile.cashFlow} />");
text = text.replace(/<div className="allocation-bars">.*?<\/div><\/div><\/div>/s, "<PremiumAllocation holdings={profile.holdings} />");
fs.writeFileSync(path, text);
console.log("Added premium data-driven chart components");
