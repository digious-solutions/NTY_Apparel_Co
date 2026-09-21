import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { AffiliatesPanel } from "@/components/admin/AffiliatesPanel";
import { BenchClubPanel } from "@/components/admin/BenchClubPanel";
import { DeadLiftPanel } from "@/components/admin/DeadLiftPanel";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { GenerateInvitesPanel } from "@/components/GenerateInvitesPanel";

const AdminDashboard = () => {
  const [active, setActive] = useState("Overview");

  return (
    <div className="admin-theme min-h-screen" style={{
      '--background': '210 40% 96%',
      '--foreground': '222 47% 11%',
      '--card': '0 0% 100%',
      '--card-foreground': '222 47% 11%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215 16% 47%',
      '--border': '214 32% 91%',
      '--primary': '211 100% 50%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '210 40% 96%',
      '--accent-foreground': '222 47% 11%',
      '--sidebar-background': '0 0% 100%',
      '--sidebar-foreground': '222 47% 11%',
      '--sidebar-accent': '210 40% 96%',
      '--sidebar-accent-foreground': '222 47% 11%',
      '--sidebar-border': '214 32% 91%',
      '--sidebar-primary': '211 100% 50%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--radius': '8px',
    } as React.CSSProperties}>
      <div className="bg-[hsl(210,40%,96%)] text-[hsl(222,47%,11%)] min-h-screen">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AdminSidebar active={active} onSelect={setActive} />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-14 flex items-center border-b border-[hsl(214,32%,91%)] bg-white px-4">
                <SidebarTrigger className="text-[hsl(222,47%,11%)]" />
                <span className="ml-3 text-sm font-medium text-[hsl(222,47%,11%)]" style={{ fontFamily: 'Inter, sans-serif' }}>{active}</span>
              </header>
              <main className="flex-1 overflow-auto p-6">
                {active === "Affiliates" ? <AffiliatesPanel /> : active === "Bench Club" ? <BenchClubPanel /> : active === "Generate Invites" ? <GenerateInvitesPanel /> : active === "Deadlift" ? <DeadLiftPanel /> : active === "Orders" ? <OrdersPanel /> : <DashboardOverview />}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default AdminDashboard;
