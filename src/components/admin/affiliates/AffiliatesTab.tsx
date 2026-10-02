// components/affiliates/AffiliatesTab.tsx
import { useEffect, useState } from "react";
import { Copy, Mail, Instagram, Music2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { API_URL, fmtMoney, fmtNum, SITE_URL, textStyle } from "./types";

type Aff = {
  id: number;
  name: string;
  email: string;
  status: string;
  earnings: number;
  referral_code: string | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  approved_at: string | null;
  discount_percent?: number | null;
  commission_percent?: number | null;
  uses_count?: number;
  active?: number;
};

export function AffiliatesTab() {
  const [rows, setRows] = useState<Aff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(true);

    try {
      const res = await fetch(`${API_URL}/api/affiliate/admin/affiliates`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load affiliates");
      }

      setRows(data.data || []);
    } catch (error) {
      console.error("Load error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load affiliates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${SITE_URL}/?ref=${code}`);
    toast.success("Link copied!");
  };

  return (
    <div style={textStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[hsl(215,16%,47%)]">
          {rows.length} active {rows.length === 1 ? "affiliate" : "affiliates"}
        </p>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-[hsl(214,32%,91%)] rounded-lg hover:bg-[hsl(210,40%,96%)]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(211,100%,50%)]"></div>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-12 text-center">
          <p className="text-sm text-[hsl(215,16%,47%)]">No active affiliates yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-base font-semibold text-[hsl(222,47%,11%)]">{a.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(215,16%,47%)] mt-1">
                    <Mail className="w-3.5 h-3.5" /> {a.email}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mt-2">
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
                      {a.instagram_handle ? `@${a.instagram_handle}` : "—"} · {fmtNum(a.instagram_followers)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5" />
                      · {fmtNum(a.tiktok_followers)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[hsl(215,16%,47%)]">Earnings</p>
                  <p className="text-xl font-semibold text-[hsl(222,47%,11%)]">{fmtMoney(a.earnings)}</p>
                  {a.uses_count !== undefined && (
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                      {a.uses_count} {a.uses_count === 1 ? "use" : "uses"}
                    </p>
                  )}
                </div>
              </div>

              {a.referral_code && (
                <div className="mt-4 pt-4 border-t border-[hsl(214,32%,91%)] flex items-center justify-between gap-3 bg-[hsl(210,40%,96%)] -mx-5 -mb-5 px-5 py-3 rounded-b-lg">
                  <div className="min-w-0">
                    <p className="text-xs text-[hsl(215,16%,47%)]">
                      Code <span className="font-semibold text-[hsl(222,47%,11%)]">{a.referral_code}</span>
                      {a.discount_percent && a.commission_percent && (
                        <span className="ml-2 text-[hsl(215,16%,47%)]">
                          · {a.discount_percent}% off / {a.commission_percent}% commission
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-mono text-[hsl(222,47%,11%)] truncate">
                      {SITE_URL}/?ref={a.referral_code}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copyLink(a.referral_code!)}
                      className="bg-white border border-[hsl(214,32%,91%)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/70 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <a
                      href={`${SITE_URL}/?ref=${a.referral_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-[hsl(214,32%,91%)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/70 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}