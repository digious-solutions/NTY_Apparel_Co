// pages/Account.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { toast } from "sonner";
import { MyRewards } from "@/components/account/MyRewards";
import { MyOrders } from "@/components/account/MyOrders";
import { MyCodes } from "@/components/account/MyCodes";
import { MyAffiliate } from "@/components/account/MyAffiliate";
import { MyBenchClub } from "@/components/account/MyBenchClub";
import { Gift, Package, User, MapPin, LogOut, Ticket, Users, Dumbbell } from "lucide-react";

type Section = "rewards" | "orders" | "codes" | "benchclub" | "affiliate" | "details" | "addresses";

const NAV: { key: Section; label: string; icon: typeof Gift }[] = [
  // { key: "rewards", label: "Rewards", icon: Gift },
  // { key: "orders", label: "Orders", icon: Package },
  // { key: "codes", label: "Codes", icon: Ticket },
  { key: "benchclub", label: "Natty Verified", icon: Dumbbell },
  { key: "affiliate", label: "Affiliate Dashboard", icon: Users },
  { key: "details", label: "Account Details", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
];

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

const Account = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, updateUser } = useAuth(); // ✅ Add updateUser
  const [section, setSection] = useState<Section>("benchclub");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // ✅ If not logged in, redirect to auth
    if (!loading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    // ✅ If user is admin, redirect to admin panel
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    // ✅ Set display name - Full name show karein
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/auth", { replace: true });
    } catch (error) {
      toast.error("Couldn't sign out");
      console.error("Sign out error:", error);
    }
  };

  // ✅ Update display name when user changes
  const handleNameUpdate = (newName: string) => {
    setDisplayName(newName);
    // ✅ Update user in context
    if (user) {
      updateUser({ ...user, name: newName });
    }
  };

  // ✅ Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // ✅ If no user, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // ✅ Full name show karein - No split
  const fullName = displayName || "Member";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {/* Scoped light theme for the account dashboard */}
      <div
        className="account-scope"
        style={
          {
            "--background": "0 0% 98%",
            "--foreground": "0 0% 8%",
            "--card": "0 0% 100%",
            "--card-foreground": "0 0% 8%",
            "--muted": "0 0% 96%",
            "--muted-foreground": "0 0% 45%",
            "--border": "0 0% 88%",
            "--input": "0 0% 88%",
            "--primary": "0 0% 8%",
            "--primary-foreground": "0 0% 100%",
            backgroundColor: "hsl(0 0% 96%)",
            color: "hsl(0 0% 8%)",
          } as React.CSSProperties
        }
      >
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
          {/* Title */}
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl tracking-tight leading-none" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              My Account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Welcome back, {fullName}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar */}
            <aside>
              <nav className="bg-card border border-foreground/10 lg:sticky lg:top-24">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSection(item.key)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm tracking-wide border-b border-foreground/10 last:border-b-0 transition ${
                        active ? "bg-foreground text-background" : "hover:bg-foreground/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left text-sm tracking-wide hover:bg-foreground/5 border-t border-foreground/10 text-muted-foreground hover:text-foreground transition"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span>Sign Out</span>
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                  {NAV.find((n) => n.key === section)?.label}
                </h2>
              </div>

              {section === "rewards" && <MyRewards userId={String(user.id)} displayName={displayName} />}
              {section === "orders" && <MyOrders email={user.email} />}
              {section === "codes" && <MyCodes email={user.email} />}
              {section === "benchclub" && <MyBenchClub />}
              {section === "affiliate" && <MyAffiliate email={user.email} />}
              {section === "details" && (
                <AccountDetails
                  userId={user.id}
                  email={user.email}
                  displayName={displayName}
                  onSaved={handleNameUpdate} // ✅ Pass updated function
                />
              )}
              {section === "addresses" && <AddressesPlaceholder />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

function AccountDetails({
  userId,
  email,
  displayName,
  onSaved,
}: {
  userId: number;
  email: string;
  displayName: string;
  onSaved: (n: string) => void;
}) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);

  // ✅ Update local state when displayName prop changes
  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  const save = async () => {
    if (!name.trim() || name.trim() === displayName) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/bench-club/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Couldn't save");
      }

      toast.success("Saved successfully");
      
      // ✅ Update local state
      setName(name.trim());
      // ✅ Call parent callback to update context and localStorage
      onSaved(name.trim());
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border border-foreground/10 bg-card p-6 space-y-5 max-w-xl">
      <div>
        <label className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Email</label>
        <p className="text-sm mt-1.5">{email}</p>
      </div>
      <div>
        <label className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Display Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full border border-foreground/15 bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
        />
      </div>
      <button
        onClick={save}
        disabled={saving || !name.trim() || name.trim() === displayName}
        className="bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.2em] uppercase disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </section>
  );
}

function AddressesPlaceholder() {
  return (
    <section className="border border-foreground/10 bg-card p-12 text-center">
      <MapPin className="w-8 h-8 mx-auto mb-4 text-muted-foreground/50" strokeWidth={1.5} />
      <p className="text-sm tracking-wider uppercase text-muted-foreground">Addresses are saved at checkout</p>
      <p className="text-xs text-muted-foreground mt-2">Your most recent shipping address is reused automatically.</p>
    </section>
  );
}

export default Account;