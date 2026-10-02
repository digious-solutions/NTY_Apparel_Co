import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react";
import { fmtMoney, textStyle, API_URL } from "./types";

type Referral = {
  affiliate_id: string | null;
  order_amount: number;
  commission_amount: number;
  created_at: string;
};

type Aff = { id: string; name: string; email: string };

type Agg = {
  id: string;
  name: string;
  revenue: number;
  commission: number;
  sales: number;
};

function aggregate(refs: Referral[], affs: Map<string, Aff>): Agg[] {
  const m = new Map<string, Agg>();
  for (const r of refs) {
    if (!r.affiliate_id) continue;
    const aff = affs.get(String(r.affiliate_id));
    if (!aff) continue;
    const key = String(r.affiliate_id);
    const cur = m.get(key) || { id: key, name: aff.name, revenue: 0, commission: 0, sales: 0 };
    cur.revenue += Number(r.order_amount || 0);
    cur.commission += Number(r.commission_amount || 0);
    cur.sales += 1;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
}

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
const startOfDay = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
};
const startOfLastMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
};

const RANK_COLORS = [
  "bg-amber-400 text-amber-950",
  "bg-slate-300 text-slate-800",
  "bg-orange-400 text-orange-950",
  "bg-blue-200 text-blue-800",
  "bg-emerald-300 text-emerald-900",
];

function Card({ title, accent, icon: Icon, rows, totalLabel }: {
  title: string;
  accent: "amber" | "blue" | "green";
  icon: typeof Trophy;
  rows: Agg[];
  totalLabel: string;
}) {
  const bg = {
    amber: "from-amber-50 to-amber-50/40 border-amber-200/60",
    blue: "from-blue-50 to-blue-50/40 border-blue-200/60",
    green: "from-emerald-50 to-emerald-50/40 border-emerald-200/60",
  }[accent];
  const top5 = rows.slice(0, 5);
  return (
    <div className={`bg-gradient-to-br ${bg} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-[hsl(222,47%,11%)]">
          <Icon className="w-4 h-4" /> {title}
        </div>
        <div className="text-xs text-[hsl(215,16%,47%)]">{totalLabel}</div>
      </div>
      {top5.length === 0 ? (
        <div className="text-sm text-[hsl(215,16%,47%)] py-6 text-center">No sales yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {top5.map((r, i) => (
            <div key={r.id} className="bg-white/80 backdrop-blur rounded-lg border border-white p-3 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${RANK_COLORS[i]}`}>{i + 1}</span>
                <span className="text-xs font-medium text-[hsl(222,47%,11%)] truncate">{r.name}</span>
              </div>
              <p className="text-lg font-bold text-[hsl(222,47%,11%)] leading-tight">{fmtMoney(r.revenue)}</p>
              <p className="text-[11px] text-[hsl(215,16%,47%)] mt-0.5">
                <span className="text-emerald-600 font-medium">{fmtMoney(r.commission)}</span> earned · {r.sales} sales
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopSellersSection() {
  const [refs, setRefs] = useState<Referral[]>([]);
  const [affs, setAffs] = useState<Aff[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/affiliate/admin/analytics`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load");

      setRefs(data.data.referrals || []);
      setAffs(data.data.affiliates || []);
      setCounts(data.data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error("Analytics load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const affMap = useMemo(() => new Map(affs.map((a) => [String(a.id), a])), [affs]);

  const allTime = useMemo(() => aggregate(refs, affMap), [refs, affMap]);
  const thisMonth = useMemo(() => {
    const s = startOfMonth();
    return aggregate(refs.filter((r) => r.created_at >= s), affMap);
  }, [refs, affMap]);
  const lastMonth = useMemo(() => {
    const s = startOfLastMonth();
    const e = startOfMonth();
    return aggregate(refs.filter((r) => r.created_at >= s && r.created_at < e), affMap);
  }, [refs, affMap]);
  const today = useMemo(() => {
    const s = startOfDay();
    return aggregate(refs.filter((r) => r.created_at >= s), affMap);
  }, [refs, affMap]);

  const totals = {
    allTime: allTime.reduce((s, r) => ({ rev: s.rev + r.revenue, comm: s.comm + r.commission, sales: s.sales + r.sales }), { rev: 0, comm: 0, sales: 0 }),
    month: thisMonth.reduce((s, r) => ({ rev: s.rev + r.revenue, comm: s.comm + r.commission, sales: s.sales + r.sales }), { rev: 0, comm: 0, sales: 0 }),
    lastMonth: lastMonth.reduce((s, r) => s + r.revenue, 0),
    today: today.reduce((s, r) => ({ rev: s.rev + r.revenue, comm: s.comm + r.commission, sales: s.sales + r.sales }), { rev: 0, comm: 0, sales: 0 }),
  };

  const activeThisMonth = thisMonth.length;
  const monthDelta = totals.lastMonth > 0 ? ((totals.month.rev - totals.lastMonth) / totals.lastMonth) * 100 : 0;
  const top5Rev = allTime.slice(0, 5).reduce((s, r) => s + r.revenue, 0);
  const concentration = totals.allTime.rev > 0 ? (top5Rev / totals.allTime.rev) * 100 : 0;
  const avgActive = activeThisMonth > 0 ? totals.month.rev / activeThisMonth : 0;

  if (loading) return <div className="text-sm text-[hsl(215,16%,47%)] mb-6">Loading affiliate insights…</div>;

  return (
    <div className="space-y-4 mb-8" style={textStyle}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(222,47%,11%)]">Affiliates</h2>
          <p className="text-sm text-[hsl(215,16%,47%)] mt-1">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <button
          onClick={load}
          className="bg-white border border-[hsl(214,32%,91%)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[hsl(210,40%,96%)]"
        >
          ↻ Refresh
        </button>
      </div>

      <Card
        title="All-Time Top Selling Affiliates"
        accent="amber"
        icon={Trophy}
        rows={allTime}
        totalLabel={`${fmtMoney(totals.allTime.rev)} all-time · ${totals.allTime.sales} sales · ${fmtMoney(totals.allTime.comm)} comm`}
      />
      <Card
        title="This Month's Top Selling Affiliates"
        accent="blue"
        icon={TrendingUp}
        rows={thisMonth}
        totalLabel={`${fmtMoney(totals.month.rev)} this month · ${fmtMoney(totals.month.comm)} comm`}
      />
      <Card
        title="Today's Top Selling Affiliates"
        accent="green"
        icon={TrendingUp}
        rows={today}
        totalLabel={`${fmtMoney(totals.today.rev)} today · ${totals.today.sales} sales · ${fmtMoney(totals.today.comm)} comm`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={DollarSign} label="All-Time Revenue" value={fmtMoney(totals.allTime.rev)} sub={`${totals.allTime.sales} sales · ${fmtMoney(totals.allTime.comm)} paid`} />
        <Stat
          icon={TrendingUp}
          label="This Month"
          value={fmtMoney(totals.month.rev)}
          sub={
            <span>
              <span className={monthDelta >= 0 ? "text-emerald-600" : "text-red-600"}>
                {monthDelta >= 0 ? "▲" : "▼"} {Math.abs(monthDelta).toFixed(1)}%
              </span>{" "}
              vs last month · {fmtMoney(totals.month.comm)} comm
            </span>
          }
        />
        <Stat icon={Users} label="Active Affiliates" value={`${activeThisMonth} / ${affs.length}`} sub={`${activeThisMonth} active this month · avg ${fmtMoney(avgActive)}`} />
        <Stat icon={BarChart3} label="Concentration" value={`${concentration.toFixed(1)}%`} sub={`top 5 share of all-time revenue`} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Trophy; label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="bg-white border border-[hsl(214,32%,91%)] rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-xs text-[hsl(215,16%,47%)] mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-2xl font-bold text-[hsl(222,47%,11%)]">{value}</p>
      <p className="text-[11px] text-[hsl(215,16%,47%)] mt-1">{sub}</p>
    </div>
  );
}