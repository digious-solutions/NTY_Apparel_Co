import { useState } from "react";
import { ApplicationsTab } from "./affiliates/ApplicationsTab";
import { AffiliatesTab } from "./affiliates/AffiliatesTab";
import { CouponsTab } from "./affiliates/CouponsTab";
import { ReferralsTab } from "./affiliates/ReferralsTab";
import { VisitsTab } from "./affiliates/VisitsTab";
import { PayoutsTab } from "./affiliates/PayoutsTab";
import { MessagesTab } from "./affiliates/MessagesTab";
import { TopSellersSection } from "./affiliates/TopSellersSection";
import { textStyle } from "./affiliates/types";

const TABS = [
  { id: "applications", label: "Applications" },
  { id: "affiliates", label: "Active" },
  { id: "coupons", label: "Coupons" },
  // { id: "referrals", label: "Referrals" },
  // { id: "visits", label: "Visits" },
  // { id: "payouts", label: "Payouts" },
  // { id: "messages", label: "Messages" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AffiliatesPanel() {
  const [tab, setTab] = useState<TabId>("applications");

  return (
    <div style={textStyle}>
      <TopSellersSection />

      <div className="flex flex-wrap gap-1 mb-6 border-b border-[hsl(214,32%,91%)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2.5 -mb-px border-b-2 transition-colors ${
              tab === t.id
                ? "border-[hsl(211,100%,50%)] text-[hsl(211,100%,50%)] font-medium"
                : "border-transparent text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "applications" && <ApplicationsTab />}
      {tab === "affiliates" && <AffiliatesTab />}
      {tab === "coupons" && <CouponsTab />}
      {/* {tab === "referrals" && <ReferralsTab />}
      {tab === "visits" && <VisitsTab />}
      {tab === "payouts" && <PayoutsTab />}
      {tab === "messages" && <MessagesTab />} */}
    </div>
  );
}
