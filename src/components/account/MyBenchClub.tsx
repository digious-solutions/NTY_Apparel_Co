// components/account/MyBenchClub.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  Dumbbell, 
  ExternalLink, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Trophy,
  Eye,
  XCircle,
  AlertCircle,
  ShoppingBag
} from "lucide-react";

const DISCORD_INVITE = "https://discord.gg/nty-bench-club";
const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

const TIERS = [
  { lbs: 225, name: "225 Club", desc: "The foundation. Two plates a side." },
  { lbs: 315, name: "315 Club", desc: "Three plates. Elite natural pressing." },
  { lbs: 405, name: "405 Club", desc: "Four plates. Rarefied air." },
];

// ===== TIER PRODUCTS CONFIGURATION =====
const TIER_PRODUCTS = [ 
  { 
    lbs: 225, 
    name: "225 lbs club",
    handle: "merch-mockups-for-225lbs-club", // Placeholder 
    image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/64A5B611-B159-4FDF-BA83-FCFB73E2EB5F.png?v=1787179212", // Placeholder
    price: "$55.00"
  },
  {
    lbs: 315, 
    name: "315 lbs club",
    handle: "315lbs-club", // Placeholder
    image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/B74049B8-1401-4C27-8834-6FF2BAE0D21B.png?v=1787179537", // Placeholder
    price: "$55.00"
  },
  { 
    lbs: 405, 
    name: "405 lbs club",
    handle: "405lbs-club", // Placeholder
    image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/7A6D3BC6-6291-45E2-AF8B-2A90FBF0E1D9.png?v=1787179897", // Placeholder
    price: "$55.00"
  }
];

type Application = {
  id: number;
  name: string;
  email: string;
  instagram_handle: string;
  lift_type: string;
  weight_tier: number;
  video_url: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  weight_tier: number;
  member_number: number;
  approved_at: string;
};

export function MyBenchClub() {
  const { user, token } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedTiers, setApprovedTiers] = useState<number[]>([]);

  useEffect(() => {
    if (user && token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ Fetch member status
      const memberRes = await fetch(`${API_URL}/api/bench-club/my-member`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        if (memberData.success && memberData.data) {
          setMember(memberData.data);
        }
      }

      // ✅ Fetch user's applications
      const appsRes = await fetch(`${API_URL}/api/bench-club/my-applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        if (appsData.success) {
          setApplications(appsData.data || []);
          
          // ✅ Calculate approved tiers
          const approved = appsData.data
            .filter((app: Application) => app.status === "approved")
            .map((app: Application) => app.weight_tier);
          setApprovedTiers(approved);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your Bench Club data");
    } finally {
      setLoading(false);
    }
  };

  const getLatestApplication = () => {
    if (applications.length === 0) return null;
    return applications[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1.5 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" /> Not Approved
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  const latestApp = getLatestApplication();
  const currentTier = member?.weight_tier ?? 0;
  const isMember = !!member;

  // ===== Helper function to check if tier product is unlocked =====
  const isTierUnlocked = (lbs: number) => {
    return approvedTiers.includes(lbs) || (isMember && currentTier >= lbs);
  };

  return (
    <div className="space-y-6">
      {/* Status hero */}
      <section
        className="relative overflow-hidden border p-8 rounded-lg"
        style={{
          background: isMember
            ? "linear-gradient(135deg, hsl(0 0% 6%) 0%, hsl(0 0% 12%) 100%)"
            : "linear-gradient(135deg, hsl(45 70% 95%) 0%, hsl(0 0% 100%) 100%)",
          borderColor: isMember ? "hsl(45 80% 50% / 0.4)" : "hsl(45 70% 80%)",
          color: isMember ? "hsl(45 80% 90%)" : "inherit",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase opacity-70 mb-3">
              <Dumbbell className="w-3.5 h-3.5" />
              Natty Bench Press Club
            </div>
            <h3 className="text-3xl sm:text-4xl tracking-tight leading-none" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              {isMember 
                ? `${member.weight_tier} CLUB` 
                : latestApp?.status === "pending" 
                  ? "UNDER REVIEW" 
                  : latestApp?.status === "rejected"
                  ? "NOT APPROVED"
                  : "NOT A MEMBER"}
            </h3>
            <p className="text-sm mt-2 opacity-80">
              {isMember
                ? `Verified · Member #${String(member.member_number).padStart(4, "0")}`
                : latestApp?.status === "pending"
                ? `Your ${latestApp.weight_tier}lb application is being reviewed.`
                : latestApp?.status === "rejected"
                ? "Your last application wasn't approved. You may reapply."
                : "Earn your spot by submitting a verified bench press video."}
            </p>
          </div>
          <div className="text-right">
            {isMember ? (
              <CheckCircle2 className="w-12 h-12 opacity-80" style={{ color: "hsl(45 90% 60%)" }} strokeWidth={1.5} />
            ) : latestApp?.status === "pending" ? (
              <Clock className="w-12 h-12 opacity-60" strokeWidth={1.5} />
            ) : latestApp?.status === "rejected" ? (
              <AlertCircle className="w-12 h-12 opacity-60 text-red-500" strokeWidth={1.5} />
            ) : (
              <Lock className="w-12 h-12 opacity-40" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {!isMember && (
          <a
            href="/natty-verification"
            className="inline-flex items-center gap-2 mt-6 bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 rounded"
          >
            {latestApp?.status === "rejected" ? "Reapply" : latestApp?.status === "pending" ? "View Application" : "Apply Now"}
          </a>
        )}
      </section>

      {/* Applications History */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4" />
          <h4 className="text-sm tracking-[0.2em] uppercase">Your Applications</h4>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
            <a href="/natty-verification" className="inline-block mt-3 text-[#B8860B] hover:underline text-sm font-medium">
              Apply Now →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="border border-foreground/10 rounded-lg p-4 bg-white/50 hover:bg-white transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{app.weight_tier} lb</span>
                      {getStatusBadge(app.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm text-gray-600">
                      <p>Lift: {app.lift_type}</p>
                      {app.instagram_handle && (
                        <p>Instagram: @{app.instagram_handle}</p>
                      )}
                    </div>
                  </div>
                  {app.video_url && app.status === "approved" && (
                    <a
                      href={app.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-[#B8860B] hover:underline"
                    >
                      <Eye className="w-4 h-4" /> Watch Video
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discord — members only */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Community</div>
            <h4 className="text-xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              Join the Bench Club Discord
            </h4>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {isMember
                ? "Private channel for verified members. Early drops, training talk, and direct line to the team."
                : "Members get access to the private Discord community once their lift is verified."}
            </p>
          </div>
          {isMember ? (
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 rounded"
            >
              Join Discord <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 border border-foreground/15 text-muted-foreground px-5 py-2.5 text-xs tracking-[0.2em] uppercase rounded">
              <Lock className="w-3.5 h-3.5" /> Members Only
            </span>
          )}
        </div>
      </section>

      {/* Tier Ladder - Dynamic Unlock */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-4 h-4" />
          <h4 className="text-sm tracking-[0.2em] uppercase">Tier Ladder</h4>
          {isMember && (
            <span className="text-xs text-muted-foreground ml-auto">
              Current: {currentTier} lbs
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TIERS.map((t) => {
            // ✅ Check if tier is unlocked (approved)
            const isUnlocked = approvedTiers.includes(t.lbs);
            // ✅ Check if tier is current member tier
            const isCurrent = isMember && currentTier === t.lbs;
            // ✅ Check if tier is lower than current (can be unlocked)
            const isEarned = isMember && currentTier >= t.lbs;
            
            return (
              <div
                key={t.lbs}
                className={`border p-4 rounded-lg transition-all ${
                  isCurrent
                    ? "border-[#141414] bg-[#141414] text-white shadow-lg"
                    : isUnlocked || isEarned
                    ? "border-green-500 bg-green-50 text-gray-900"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                    {t.lbs}
                  </span>
                  {isUnlocked || isEarned ? (
                    <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-green-600'}`} strokeWidth={2} />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-[10px] tracking-[0.2em] uppercase opacity-70">{t.name}</p>
                <p className="text-xs mt-2 opacity-70 leading-snug">{t.desc}</p>
                {isUnlocked && !isCurrent && (
                  <span className="inline-block mt-2 text-[10px] font-medium text-green-600">
                    ✓ Unlocked
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-block mt-2 text-[10px] font-medium text-white/80">
                    ★ Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          NEW: TIER PRODUCTS SECTION - UNLOCKS WITH TIER PROGRESS
          ============================================================ */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="w-4 h-4" />
          <h4 className="text-sm tracking-[0.2em] uppercase">Tier Products</h4>
          {isMember && (
            <span className="text-xs text-muted-foreground ml-auto">
              {approvedTiers.length} / {TIER_PRODUCTS.length} unlocked
            </span>
          )}
        </div>

        {!isMember ? (
          <div className="text-center py-8">
            <Lock className="w-10 h-10 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Become a member to unlock tier products.</p>
            <a href="/natty-verification" className="inline-block mt-3 text-[#B8860B] hover:underline text-sm font-medium">
              Apply Now →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIER_PRODUCTS.map((product) => {
              const isUnlocked = isTierUnlocked(product.lbs);
              
              return (
                <div
                  key={product.lbs}
                  className={`group relative border rounded-lg overflow-hidden transition-all ${
                    isUnlocked 
                      ? "border-[#B8860B]/30 hover:border-[#B8860B] hover:shadow-lg hover:shadow-[#B8860B]/10" 
                      : "border-gray-200 opacity-60"
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Lock Overlay for locked products */}
                    {/* {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white/80" strokeWidth={1.5} />
                      </div>
                    )} */}
                    {/* Unlocked Badge */}
                    {isUnlocked && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-medium px-2 py-1 rounded">
                        ✓ Unlocked
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                          {product.lbs} lbs Club
                        </p>
                        {/* <h5 className="font-semibold text-sm mt-0.5">{product.name}</h5> */}
                      </div>
                      <span className="font-bold text-[#B8860B]">{product.price}</span>
                    </div>

                    {/* Action Button */}
                    {isUnlocked ? (
                      <a
                        href={`https://ntygear.com/products/${product.handle}`}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#141414] text-white px-4 py-2 text-xs tracking-[0.2em] uppercase hover:bg-[#2a2a2a] transition rounded"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Shop Now
                      </a>
                    ) : (
                      <button
                        disabled
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-4 py-2 text-xs tracking-[0.2em] uppercase rounded cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Locked
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}