// components/AdminSidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Users,
  UserCheck,
  Ticket,
  MessageSquare,
  XCircle,
  RotateCcw,
  Mail,
  Gift,
  Send,
  Dumbbell,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const menuItems = [
  { title: "Overview", icon: LayoutDashboard },
  { title: "Orders", icon: ShoppingCart },
  { title: "Payments", icon: CreditCard },
  { title: "Cart Activity", icon: ShoppingBag },
  { title: "Customers", icon: Users },
  { title: "Affiliates", icon: UserCheck },
  { title: "Bench Club", icon: Dumbbell },
  // { title: "Deadlift", icon: Dumbbell },
  // { title: "Generate Invites", icon: Send },
  { title: "Coupons", icon: Ticket },
  { title: "Messages", icon: MessageSquare },
  { title: "Didn't Pay", icon: XCircle },
  { title: "Recovery", icon: RotateCcw },
  { title: "Email Leads", icon: Mail },
  { title: "Rewards", icon: Gift },
];

interface AdminSidebarProps {
  active: string;
  onSelect: (title: string) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { signOut } = useAuth(); // ✅ Use auth context for sign out
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    try {
      // ✅ Clear auth state and localStorage
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth", { replace: true });
    } catch (error) {
      toast.error("Couldn't sign out. Please try again.");
      console.error("Sign out error:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[hsl(214,32%,91%)]">
      <SidebarContent className="bg-white">
        <a href="/" className="px-4 py-4 flex items-center gap-2 hover:opacity-70 transition" aria-label="Back to home">
          <span className="font-heading text-2xl tracking-wider text-[hsl(222,47%,11%)]">NTY</span>
          {!collapsed && (
            <span className="text-[hsl(215,16%,47%)] text-xs font-medium normal-case" style={{ fontFamily: 'Inter, sans-serif' }}>
              Admin
            </span>
          )}
        </a>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onSelect(item.title)}
                    className={`cursor-pointer ${
                      active === item.title
                        ? "text-[hsl(211,100%,50%)] bg-[hsl(210,40%,96%)] font-medium"
                        : "text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)]"
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal' }}
                  >
                    <item.icon className="h-4 w-4 mr-2 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto border-t border-[hsl(214,32%,91%)] p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center rounded-md px-2 py-2 text-[hsl(215,16%,47%)] transition hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)]"
            style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal' }}
            aria-label="Sign out"
            type="button"
          >
            <LogOut className="h-4 w-4 mr-2 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}