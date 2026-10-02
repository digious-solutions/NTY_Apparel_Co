import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Copy, ExternalLink, RefreshCw, TrendingUp, DollarSign, Eye, Wallet,
  CreditCard, Sparkles, Trophy, Gem, Award, Link2, Users, Mail,
} from "lucide-react";
import { toast } from "sonner";

type Affiliate = {
  id: string; name: string; email: string; status: string;
  referral_code: string | null; earnings: number; approved_at: string | null;
};
type Link = { code: string; discount_percent: number; commission_percent: number; uses_count: number; active: boolean };
type Referral = { id: string; order_number: string | null; customer_email: string | null; order_amount: number; commission_amount: number; status: string; created_at: string };
type Payout = { id: string; amount: number; status: string; created_at: string; paid_at: string | null };
type Visit = { id: string; created_at: string; path: string | null; country: string | null };

const SITE_URL = "https://ntygear.com";
const BYPASS_EMAILS = ["gattbilly3@gmail.com", "gattbilly5@gmail.com", "preview@ntyapparel.com"];

const TIERS = [
  { name: "Starter",  min: 0,      max: 9999,   rate: 10, Icon: Sparkles },
  { name: "Silver",   min: 10000,  max: 29999,  rate: 15, Icon: TrendingUp },
  { name: "Gold",     min: 30000,  max: 49999,  rate: 20, Icon: Trophy },
  { name: "Platinum", min: 50000,  max: 74999,  rate: 25, Icon: Gem },
  { name: "Diamond",  min: 75000,  max: 99999,  rate: 30, Icon: Gem },
  { name: "Elite",    min: 100000, max: 499999, rate: 35, Icon: Award },
  { name: "Partner",  min: 500000, max: Infinity, rate: 0, Icon: Sparkles },
];

type TabKey = "overview" | "referrals" | "visits" | "payouts";

export function MyAffiliate({ email }: { email: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aff, setAff] = useState<Affiliate | null>(null);
  const [link, setLink] = useState<Link | null>(null);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");

  const load = async () => {
    try {
      const { data: a, error: affErr } = await supabase
        .from("affiliates").select("*").ilike("email", email).eq("status", "approved").maybeSingle();
      if (affErr) throw affErr;
      if (!a) {
        if (BYPASS_EMAILS.includes(email.toLowerCase())) {
          setAff({ id: "preview-0000", name: "Preview", email, status: "approved", referral_code: "PREVIEW10", earnings: 0, approved_at: new Date().toISOString() });
          setLink({ code: "PREVIEW10", discount_percent: 10, commission_percent: 15, uses_count: 0, active: true });
          setRefs([]); setPayouts([]); setVisits([]);
          return;
        }
        setAff(null); return;
      }
      setAff(a as Affiliate);
      const [linkRes, refsRes, payoutsRes, visitsRes] = await Promise.all([
        supabase.from("affiliate_coupon_links").select("*").eq("affiliate_id", a.id).eq("active", true).maybeSingle(),
        supabase.from("affiliate_referrals").select("*").eq("affiliate_id", a.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("affiliate_payouts").select("*").eq("affiliate_id", a.id).order("created_at", { ascending: false }).limit(25),
        supabase.from("affiliate_visits").select("id, created_at, path, country").eq("affiliate_id", a.id).order("created_at", { ascending: false }).limit(100),
      ]);
      setLink((linkRes.data as Link) || null);
      setRefs((refsRes.data as Referral[]) || []);
      setPayouts((payoutsRes.data as Payout[]) || []);
      setVisits((visitsRes.data as Visit[]) || []);
    } catch (e: any) {
      console.error("Affiliate load failed", e);
      toast.error("Couldn't load affiliate data. Please refresh.");
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);

      // Wait for the auth session before querying — avoids an RLS race where
      // auth.email() is null and the affiliate row silently filters out.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 3000);
          const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            if (s) { clearTimeout(timeout); sub.subscription.unsubscribe(); resolve(); }
          });
        });
      }

      if (!mounted) return;
      try {
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success("Refreshed");
  };

  const code = aff?.referral_code || link?.code || "";
  const fullLink = `${SITE_URL}/?ref=${code}`;
  const paidOut = useMemo(() => payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0), [payouts]);
  const pending = Math.max(0, Number(aff?.earnings || 0) - paidOut);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todaySales = refs.filter(r => new Date(r.created_at) >= todayStart).reduce((s, r) => s + Number(r.order_amount || 0), 0);
  const gmv = refs.reduce((s, r) => s + Number(r.order_amount || 0), 0);
  const clicks = visits.length;
  const convRate = clicks > 0 ? (refs.length / clicks) * 100 : 0;

  const currentTier = TIERS.slice().reverse().find(t => gmv >= t.min) || TIERS[0];
  const currentIdx = TIERS.indexOf(currentTier);
  const nextTier = TIERS[currentIdx + 1] || null;
  const gmvToNext = nextTier ? Math.max(0, nextTier.min - gmv) : 0;

  if (loading) return <p className="text-xs tracking-widest uppercase text-muted-foreground">Loading…</p>;

  if (!aff) {
    return (
      <section className="border border-foreground/10 bg-card p-12 text-center">
        <Users className="w-8 h-8 mx-auto mb-4 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="text-sm tracking-wider uppercase text-muted-foreground">You're not an affiliate yet</p>
        <p className="text-xs text-muted-foreground mt-2">Apply through the Partners page to start earning.</p>
        <a href="http://ntygear.com/pages/partners" className="inline-block mt-5 bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.2em] uppercase">Become a partner</a>
      </section>
    );
  }

  const copy = (text: string, label: string) => { navigator.clipboard.writeText(text); toast.success(`${label} copied`); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl sm:text-4xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            AFFILIATE DASHBOARD
          </h2>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2">
            ID: #{aff.id.slice(0, 8)} · Status: <span className="text-gold-deep font-semibold">{aff.status}</span>
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 border border-foreground/15 px-4 py-2 text-xs tracking-[0.2em] uppercase hover:bg-foreground/5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Referral Link bar */}
      <section className="border border-gold/30 bg-gradient-to-r from-gold-soft/40 to-gold-soft/10 p-5">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold-deep font-semibold">Referral Link</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm sm:text-base truncate font-mono">{fullLink}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => copy(fullLink, "Link")} className="border border-gold/40 bg-background/60 p-2 hover:bg-gold/10"><Copy className="w-4 h-4 text-gold-deep" /></button>
            <a href={fullLink} target="_blank" rel="noopener noreferrer" className="border border-gold/40 bg-background/60 p-2 hover:bg-gold/10"><ExternalLink className="w-4 h-4 text-gold-deep" /></a>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-foreground/10 flex items-center gap-1 overflow-x-auto">
        {([
          { k: "overview",  l: "Overview" },
          { k: "referrals", l: "Referrals" },
          { k: "visits",    l: "Visits" },
          { k: "payouts",   l: "Payouts" },
        ] as { k: TabKey; l: string }[]).map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-xs tracking-[0.2em] uppercase border-b-2 -mb-px transition-colors ${
              tab === t.k ? "border-gold text-gold-deep font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >{t.l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<TrendingUp />} label="Commission Rate" value={`${link?.commission_percent ?? currentTier.rate}%`} sub="on product subtotal" />
            <StatCard icon={<DollarSign />} label="Today's Sales" value={`$${todaySales.toFixed(2)}`} sub="generated today" />
            <StatCard icon={<DollarSign />} label="Lifetime Earnings" value={`$${Number(aff.earnings || 0).toFixed(2)}`} sub="all-time commission" />
            <StatCard icon={<Eye />} label="Lifetime Clicks" value={String(clicks)} sub="tracked link visits" />
            <StatCard icon={<Wallet />} label="Unpaid Earnings" value={`$${pending.toFixed(2)}`} sub="" />
            <StatCard icon={<CreditCard />} label="Paid Earnings" value={`$${paidOut.toFixed(2)}`} sub="" />
            <StatCard icon={<TrendingUp />} label="Conversion Rate" value={`${convRate.toFixed(1)}%`} sub={`${refs.length} ref / ${clicks} clicks`} />
            <StatCard icon={<Users />} label="Total Referrals" value={String(refs.length)} sub="all-time orders" />
          </div>

          {/* Commission Ladder */}
          <section className="relative overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-gold-soft/40 via-card to-card p-6 sm:p-8 shadow-[0_4px_24px_-8px_hsl(var(--gold)/0.35)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 border border-gold/40 bg-background/60 px-3 py-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold-deep" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold-deep font-semibold">Commission Tiers</span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                    Your Commission Ladder
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Grow your GMV to unlock higher commission rates.</p>
                </div>
                <div className="flex gap-3">
                  <MiniStat label="All-time GMV" value={`$${gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                  <MiniStat label="Current Tier" value={currentTier.name} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <MiniStat label="Current Rate" value={`${link?.commission_percent ?? currentTier.rate}%`} block />
                <MiniStat label="Next Tier" value={nextTier?.name || "Maxed"} block />
                <MiniStat label="GMV to Next Tier" value={nextTier ? `$${gmvToNext.toLocaleString()}` : "—"} block />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {TIERS.map((t, i) => {
                  const isCurrent = i === currentIdx;
                  const isUnlocked = gmv >= t.min;
                  const progress = t.max === Infinity
                    ? (isUnlocked ? 100 : Math.min(100, (gmv / t.min) * 100))
                    : isUnlocked ? 100 : Math.min(100, ((gmv - (TIERS[i - 1]?.min || 0)) / (t.min - (TIERS[i - 1]?.min || 0))) * 100);
                  const left = Math.max(0, t.min - gmv);
                  const TierIcon = t.Icon;
                  return (
                    <div key={t.name} className={`relative border p-5 transition-all ${
                      isCurrent ? "border-gold border-2 bg-gradient-to-br from-gold-soft/30 to-transparent shadow-[0_0_0_4px_hsl(var(--gold)/0.15)]"
                      : isUnlocked ? "border-gold/40 bg-gold-soft/10"
                      : "border-foreground/10 bg-card opacity-90"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="inline-flex items-center gap-1.5 border border-foreground/15 bg-background px-2.5 py-1">
                          <TierIcon className={`w-3.5 h-3.5 ${isUnlocked ? "text-gold-deep" : "text-muted-foreground"}`} />
                          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold">{t.name}</span>
                        </div>
                        <span className={`text-[9px] tracking-[0.25em] uppercase px-2 py-0.5 border ${
                          isCurrent ? "bg-gold text-background border-gold" : isUnlocked ? "border-gold/40 text-gold-deep" : "border-foreground/15 text-muted-foreground"
                        }`}>{isCurrent ? "Current" : isUnlocked ? "Unlocked" : "Locked"}</span>
                      </div>

                      <p className="text-lg sm:text-xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        {t.max === Infinity ? `$${t.min.toLocaleString()}+ GMV` : `$${t.min.toLocaleString()} – $${t.max.toLocaleString()} GMV`}
                      </p>
                      <p className="text-sm font-medium mt-1">{t.rate > 0 ? `${t.rate}% Commission` : "Custom Rate"}</p>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5">
                          <span>Progress</span>
                          <span className="text-gold-deep font-semibold">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-foreground/5 overflow-hidden rounded-full">
                          <div className="h-full bg-gradient-to-r from-gold to-gold-deep transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {isUnlocked ? "Tier unlocked" : `$${left.toLocaleString()} GMV left to unlock`}
                        </p>
                      </div>

                      {t.name === "Partner" && (
                        <a href="mailto:support@ntyapparel.com" className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold-deep underline underline-offset-4 hover:text-gold">
                          <Mail className="w-3 h-3" /> Contact us for custom rate
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Code preview */}
          {link && (
            <section className="border border-foreground/10 bg-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Discount Code</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-base bg-gold-soft/40 border border-gold/30 px-3 py-1.5">{code}</span>
                  <button onClick={() => copy(code, "Code")} className="border border-foreground/15 p-2 hover:bg-foreground/5"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <Mini label="Customer Discount" value={`${link.discount_percent}%`} />
              <Mini label="Your Commission" value={`${link.commission_percent}%`} />
            </section>
          )}

          {/* Recent referrals teaser */}
          <section className="border border-foreground/10 bg-card">
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
              <h4 className="text-xs tracking-[0.25em] uppercase">Recent Referrals</h4>
              {refs.length > 0 && (
                <button onClick={() => setTab("referrals")} className="text-xs text-gold-deep hover:text-gold tracking-wider uppercase">View all →</button>
              )}
            </div>
            {refs.length === 0 ? (
              <EmptyRow icon={<Link2 />} text="No referrals yet" />
            ) : (
              <RefList items={refs.slice(0, 5)} />
            )}
          </section>
        </>
      )}

      {tab === "referrals" && (
        <section className="border border-foreground/10 bg-card">
          <div className="px-6 py-4 border-b border-foreground/10">
            <h4 className="text-xs tracking-[0.25em] uppercase">All Referrals</h4>
          </div>
          {refs.length === 0 ? <EmptyRow icon={<Link2 />} text="No referrals yet" /> : <RefList items={refs} />}
        </section>
      )}

      {tab === "visits" && (
        <section className="border border-foreground/10 bg-card">
          <div className="px-6 py-4 border-b border-foreground/10">
            <h4 className="text-xs tracking-[0.25em] uppercase">Link Visits ({clicks})</h4>
          </div>
          {visits.length === 0 ? (
            <EmptyRow icon={<Eye />} text="No visits yet" />
          ) : (
            <div className="divide-y divide-foreground/10">
              {visits.map(v => (
                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                  <p className="text-sm truncate">{v.path || "/"}</p>
                  <p className="text-xs text-muted-foreground">{v.country || "—"} · {new Date(v.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "payouts" && (
        <section className="border border-foreground/10 bg-card">
          <div className="px-6 py-4 border-b border-foreground/10">
            <h4 className="text-xs tracking-[0.25em] uppercase">Payouts</h4>
          </div>
          {payouts.length === 0 ? (
            <EmptyRow icon={<Wallet />} text="No payouts yet" />
          ) : (
            <div className="divide-y divide-foreground/10">
              {payouts.map(p => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">${Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] tracking-[0.2em] uppercase px-2 py-1 ${p.status === "paid" ? "bg-gold text-background" : "bg-foreground/10"}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="border border-foreground/10 bg-card p-5 hover:border-gold/40 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 flex items-center justify-center bg-gold-soft/40 border border-gold/30 text-gold-deep">
          <span className="[&_svg]:w-4 [&_svg]:h-4">{icon}</span>
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl mt-3 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, block }: { label: string; value: string; block?: boolean }) {
  return (
    <div className={`border border-gold/30 bg-background/70 px-4 py-3 ${block ? "" : "min-w-[140px]"}`}>
      <p className="text-[10px] tracking-[0.25em] uppercase text-gold-deep font-semibold">{label}</p>
      <p className="text-lg sm:text-xl mt-0.5 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/10 px-3 py-2.5">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="p-10 text-center text-xs tracking-widest uppercase text-muted-foreground">
      <span className="inline-block mb-3 opacity-40 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:mx-auto">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function RefList({ items }: { items: Referral[] }) {
  return (
    <div className="divide-y divide-foreground/10">
      {items.map(r => (
        <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{r.order_number || "Order"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {r.customer_email || "—"} · {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gold-deep">+${Number(r.commission_amount).toFixed(2)}</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">on ${Number(r.order_amount).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
