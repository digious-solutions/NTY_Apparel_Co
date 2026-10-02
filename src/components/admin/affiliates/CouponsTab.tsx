// components/affiliates/CouponsTab.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { API_URL, textStyle } from "./types";

type Row = {
  id: number;
  code: string;
  discount_percent: number;
  commission_percent: number;
  active: number;
  uses_count: number;
  affiliate_id: number;
  affiliate_name: string | null;
  affiliate_email: string | null;
  shopify_price_rule_id: string | null;
  shopify_discount_code_id: string | null;
  created_at: string;
};

export function CouponsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(true);

    try {
      const res = await fetch(`${API_URL}/api/affiliate/admin/coupons`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load coupons");
      }

      setRows(data.data || []);
    } catch (error) {
      console.error("Load error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load coupons");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (r: Row) => {
    setBusy(r.id);
    try {
      const res = await fetch(
        `${API_URL}/api/affiliate/admin/coupons/${r.id}/toggle`,
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Toggle failed");
      }

      toast.success(r.active ? "Coupon disabled" : "Coupon enabled");
      await load(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toggle failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={textStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[hsl(215,16%,47%)]">
          {rows.length} {rows.length === 1 ? "coupon" : "coupons"}
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
          <ShoppingBag className="w-10 h-10 mx-auto text-[hsl(215,16%,47%)] mb-3" />
          <p className="text-sm text-[hsl(215,16%,47%)]">
            No coupons yet — approve an application to provision one.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(210,40%,96%)] text-[hsl(215,16%,47%)] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Affiliate</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium">Uses</th>
                  <th className="px-4 py-3 font-medium">Shopify</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(214,32%,91%)]">
                {rows.map((r) => (
                  <tr key={r.id} className="text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)]">
                    <td className="px-4 py-3 font-mono font-semibold">{r.code}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{r.affiliate_name ?? "—"}</p>
                        <p className="text-xs text-[hsl(215,16%,47%)]">{r.affiliate_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{r.discount_percent}%</td>
                    <td className="px-4 py-3">{r.commission_percent}%</td>
                    <td className="px-4 py-3">{r.uses_count}</td>
                    <td className="px-4 py-3">
                      {r.shopify_discount_code_id ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✅ Synced
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          ⚠️ Not Synced
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(r)}
                        disabled={busy === r.id}
                        className="text-sm text-[hsl(211,100%,50%)] hover:underline disabled:opacity-50"
                      >
                        {busy === r.id ? "..." : r.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}