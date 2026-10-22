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
  { lbs: 500, name: "500 Club", desc: "Five plates. Rarefied air." },
  { lbs: 600, name: "600 Club", desc: "Six plates. Rarefied air." },
  { lbs: 700, name: "700 Club", desc: "Seven plates. Rarefied air." },
];

const DEADLIFT_TIERS = [
  { lbs: 225, name: "225 Club", desc: "Two plates off the floor." },
  { lbs: 315, name: "315 Club", desc: "Three plates pulled." },
  { lbs: 405, name: "405 Club", desc: "Four plates pulled." },
  { lbs: 500, name: "500 Club", desc: "A major deadlift milestone." },
  { lbs: 600, name: "600 Club", desc: "Elite pulling strength." },
  { lbs: 700, name: "700 Club", desc: "Exceptional deadlift strength." },
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

const DEADLIFT_TIER_PRODUCTS = [
  { lbs: 225, name: "Deadlift 225 Club", handle: "225-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/225lbsDeadlift.jpg?v=1792104074", price: "$55.00" },
  { lbs: 315, name: "Deadlift 315 Club", handle: "315-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/315lbsDeadlift.png?v=1792104156", price: "$55.00" },
  { lbs: 405, name: "Deadlift 405 Club", handle: "405-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/405lbsDeadlift.png?v=1792103582", price: "$55.00" },
  { lbs: 500, name: "Deadlift 500 Club", handle: "500-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/500lbsDeadlift.png?v=1792103731", price: "$55.00" },
  { lbs: 600, name: "Deadlift 600 Club", handle: "600-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/600lbsDeadlift.png?v=1792103816", price: "$55.00" },
  { lbs: 700, name: "Deadlift 700 Club", handle: "700-lbs-deadlift", image: "https://cdn.shopify.com/s/files/1/0627/6933/2295/files/700lbsdeadlift.jpg?v=1792104226", price: "$55.00" },
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
  country?: string | null;
  age_group?: string | null;
  parent_guardian_email?: string | null;
  media_permission?: boolean | null;
  footage_approved_for_promo?: boolean | null;
  consent_timestamp?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string | null;
};

type Member = {
  id: number;
  name: string;
  email: string;
  lift_type?: string | null;
  weight_tier: number;
  member_number: number;
  approved_at: string;
};

const membershipIncludesLift = (liftType: string | null | undefined, lift: "Bench Press" | "Deadlift") => {
  const normalizedLiftType = liftType?.trim().toLowerCase();
  return normalizedLiftType === lift.toLowerCase() || normalizedLiftType === "both";
};

const getLatestApprovedApplication = (
  applications: Application[],
  lift: "Bench Press" | "Deadlift",
) => applications
  .filter((application) => (
    application.status === "approved" && membershipIncludesLift(application.lift_type, lift)
  ))
  .sort((a, b) => (
    new Date(b.reviewed_at || b.created_at).getTime() -
    new Date(a.reviewed_at || a.created_at).getTime()
  ))[0] ?? null;

function TierLadder({
  title,
  tiers,
  isMember,
  currentTier,
  maxTier,
}: {
  title: string;
  tiers: typeof TIERS;
  isMember: boolean;
  currentTier: number;
  maxTier: number;
}) {
  return (
    <section className="border border-foreground/10 bg-card p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4" />
        <h4 className="text-sm tracking-[0.2em] uppercase">{title}</h4>
        {isMember && (
          <span className="text-xs text-muted-foreground ml-auto">
            Current: {currentTier} lbs
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const isUnlocked = isMember && maxTier >= tier.lbs;
          const isCurrent = isMember && currentTier === tier.lbs;

          return (
            <div
              key={tier.lbs}
              className={`border p-4 rounded-lg transition-all ${isCurrent
                ? "border-[#141414] bg-[#141414] text-white shadow-lg"
                : isUnlocked
                  ? "border-green-500 bg-green-50 text-gray-900"
                  : "border-gray-200 bg-gray-50 opacity-60"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                  {tier.lbs}
                </span>
                {isUnlocked ? (
                  <CheckCircle2 className={`w-4 h-4 ${isCurrent ? "text-white" : "text-green-600"}`} strokeWidth={2} />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase opacity-70">{tier.name}</p>
              <p className="text-xs mt-2 opacity-70 leading-snug">{tier.desc}</p>
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
  );
}

export function MyBenchClub() {
  const { user, token, expireSession } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    setMembers([]);
    setApplications([]);
    try {
      // ✅ Fetch member status
      const memberRes = await fetch(`${API_URL}/api/bench-club/my-member`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!memberRes.ok) {
        if (memberRes.status === 401) {
          expireSession();
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(`Failed to load memberships (${memberRes.status}).`);
      }
      const memberData = await memberRes.json();
      if (!memberData.success) {
        throw new Error(memberData.error || "Failed to load memberships.");
      }
      const memberRows = memberData.members ?? memberData.data;
      const memberList = Array.isArray(memberRows) ? memberRows : memberRows ? [memberRows] : [];
      setMembers(memberList);

      // ✅ Fetch user's applications
      const appsRes = await fetch(`${API_URL}/api/bench-club/my-applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!appsRes.ok) {
        if (appsRes.status === 401) {
          expireSession();
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(`Failed to load applications (${appsRes.status}).`);
      }
      const appsData = await appsRes.json();
      if (!appsData.success) {
        throw new Error(appsData.error || "Failed to load applications.");
      }
      setApplications(appsData.data || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      const message = error instanceof Error ? error.message : "Failed to load your Bench Club data.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getLatestApplication = (lift: "Bench Press" | "Deadlift") => {
    return applications.find((application) => membershipIncludesLift(application.lift_type, lift)) ?? null;
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

  if (loadError) {
    return (
      <section role="alert" className="border border-red-200 bg-red-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Your Bench Club data could not be loaded</h3>
        <p className="text-sm mt-2">{loadError}</p>
        {loadError.includes("session has expired") ? (
          <a href="/auth" className="inline-block mt-4 underline">Sign in again</a>
        ) : (
          <button
            type="button"
            onClick={() => void fetchData()}
            className="mt-4 underline"
          >
            Try again
          </button>
        )}
      </section>
    );
  }

  const benchMember = members
    .filter((candidate) => membershipIncludesLift(candidate.lift_type, "Bench Press"))
    .sort((a, b) => b.weight_tier - a.weight_tier)[0] ?? null;
  const deadliftMember = members
    .filter((candidate) => membershipIncludesLift(candidate.lift_type, "Deadlift"))
    .sort((a, b) => b.weight_tier - a.weight_tier)[0] ?? null;
  const approvedBenchApplications = applications.filter((app) => (
    app.status === "approved" && membershipIncludesLift(app.lift_type, "Bench Press")
  ));
  const approvedDeadliftApplications = applications.filter((app) => (
    app.status === "approved" && membershipIncludesLift(app.lift_type, "Deadlift")
  ));
  const latestApprovedBenchApplication = getLatestApprovedApplication(applications, "Bench Press");
  const latestApprovedDeadliftApplication = getLatestApprovedApplication(applications, "Deadlift");
  const maxBenchTier = Math.max(benchMember?.weight_tier ?? 0, ...approvedBenchApplications.map((app) => app.weight_tier));
  const maxDeadliftTier = Math.max(deadliftMember?.weight_tier ?? 0, ...approvedDeadliftApplications.map((app) => app.weight_tier));
  const currentBenchTier = latestApprovedBenchApplication?.weight_tier ?? benchMember?.weight_tier ?? maxBenchTier;
  const currentDeadliftTier = latestApprovedDeadliftApplication?.weight_tier ?? deadliftMember?.weight_tier ?? maxDeadliftTier;
  const isMember = !!benchMember || approvedBenchApplications.length > 0;
  const isDeadliftMember = !!deadliftMember || approvedDeadliftApplications.length > 0;
  const heroLift = isMember ? "Bench Press" : "Deadlift";
  const heroMember = isMember ? benchMember : deadliftMember;
  const heroIsMember = isMember || isDeadliftMember;
  const heroCurrentTier = isMember ? currentBenchTier : currentDeadliftTier;
  const heroLatestApplication = getLatestApplication(heroLift);
  const heroMemberNumber = heroMember?.member_number;

  // ===== Helper function to check if tier product is unlocked =====
  const isTierUnlocked = (lbs: number) => {
    return isMember && maxBenchTier >= lbs;
  };

  const isDeadliftTierUnlocked = (lbs: number) => {
    return isDeadliftMember && maxDeadliftTier >= lbs;
  };

  return (
    <div className="space-y-6">
      {/* Status hero */}
      <section
        className="relative overflow-hidden border p-8 rounded-lg"
        style={{
          background: heroIsMember
            ? "linear-gradient(135deg, hsl(0 0% 6%) 0%, hsl(0 0% 12%) 100%)"
            : "linear-gradient(135deg, hsl(45 70% 95%) 0%, hsl(0 0% 100%) 100%)",
          borderColor: heroIsMember ? "hsl(45 80% 50% / 0.4)" : "hsl(45 70% 80%)",
          color: heroIsMember ? "hsl(45 80% 90%)" : "inherit",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase opacity-70 mb-3">
              <Dumbbell className="w-3.5 h-3.5" />
              {heroLift === "Bench Press" ? "Natty Bench Press Club" : "Natty Deadlift Club"}
            </div>
            <h3 className="text-3xl sm:text-4xl tracking-tight leading-none" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              {heroIsMember
                ? `${heroCurrentTier} CLUB`
                : heroLatestApplication?.status === "pending"
                  ? "UNDER REVIEW"
                  : heroLatestApplication?.status === "rejected"
                    ? "NOT APPROVED"
                    : "NOT A MEMBER"}
            </h3>
            <p className="text-sm mt-2 opacity-80">
              {heroIsMember
                ? heroMemberNumber
                  ? `Verified · Member #${String(heroMemberNumber).padStart(4, "0")}`
                  : `Verified ${heroLift} member`
                : heroLatestApplication?.status === "pending"
                  ? `Your ${heroLatestApplication.weight_tier}lb application is being reviewed.`
                  : heroLatestApplication?.status === "rejected"
                    ? "Your last application wasn't approved. You may reapply."
                    : `Earn your spot by submitting a verified ${heroLift === "Bench Press" ? "bench press" : "deadlift"} video.`}
            </p>
          </div>
          <div className="text-right">
            {heroIsMember ? (
              <CheckCircle2 className="w-12 h-12 opacity-80" style={{ color: "hsl(45 90% 60%)" }} strokeWidth={1.5} />
            ) : heroLatestApplication?.status === "pending" ? (
              <Clock className="w-12 h-12 opacity-60" strokeWidth={1.5} />
            ) : heroLatestApplication?.status === "rejected" ? (
              <AlertCircle className="w-12 h-12 opacity-60 text-red-500" strokeWidth={1.5} />
            ) : (
              <Lock className="w-12 h-12 opacity-40" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {!heroIsMember && (
          <a
            href="/natty-verification"
            className="inline-flex items-center gap-2 mt-6 bg-foreground text-background px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 rounded"
          >
            {heroLatestApplication?.status === "rejected" ? "Reapply" : heroLatestApplication?.status === "pending" ? "View Application" : "Apply Now"}
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
                      <p>Country: {app.country || "Not provided"} · Age: {app.age_group || "Not provided"}</p>
                      {app.instagram_handle && (
                        <p>Instagram: @{app.instagram_handle}</p>
                      )}
                      <p>Media permission: {app.media_permission === null || app.media_permission === undefined ? "Not recorded" : app.media_permission ? "Granted" : "Not granted"}</p>
                      <p>Application consent: {app.consent_timestamp ? `Confirmed ${new Date(app.consent_timestamp).toLocaleString()}` : "Not recorded"}</p>
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

      <TierLadder
        title="Bench Club Tier Ladder"
        tiers={TIERS}
        isMember={isMember}
        currentTier={currentBenchTier}
        maxTier={maxBenchTier}
      />

      {/* ============================================================
          NEW: TIER PRODUCTS SECTION - UNLOCKS WITH TIER PROGRESS
          ============================================================ */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="w-4 h-4" />
          <h4 className="text-sm tracking-[0.2em] uppercase">Bench Club Tier Products</h4>
          {isMember && (
            <span className="text-xs text-muted-foreground ml-auto">
              {TIER_PRODUCTS.filter((product) => isTierUnlocked(product.lbs)).length} / {TIER_PRODUCTS.length} unlocked
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
                  className={`group relative border rounded-lg overflow-hidden transition-all ${isUnlocked
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

      {isDeadliftMember && (
        <TierLadder
          title="Deadlift Tier Ladder"
          tiers={DEADLIFT_TIERS}
          isMember={isDeadliftMember}
          currentTier={currentDeadliftTier}
          maxTier={maxDeadliftTier}
        />
      )}

      {/* Deadlift products unlock only for Deadlift or Both members, by their verified tier. */}
      <section className="border border-foreground/10 bg-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag className="w-4 h-4" />
          <h4 className="text-sm tracking-[0.2em] uppercase">Deadlift Tier Products</h4>
          {isDeadliftMember && (
            <span className="text-xs text-muted-foreground ml-auto">
              {DEADLIFT_TIER_PRODUCTS.filter((product) => isDeadliftTierUnlocked(product.lbs)).length} / {DEADLIFT_TIER_PRODUCTS.length} unlocked
            </span>
          )}
        </div>

        {!isDeadliftMember && (
          <div className="text-center py-5 mb-5 border border-dashed border-foreground/15 rounded-lg">
            <Lock className="w-10 h-10 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Deadlift products are for verified Deadlift Club members.</p>
            <a href="/natty-verification" className="inline-block mt-3 text-[#B8860B] hover:underline text-sm font-medium">
              Apply Now →
            </a>
          </div>
        )}
        {isDeadliftMember && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEADLIFT_TIER_PRODUCTS.map((product) => {
              const isUnlocked = isDeadliftTierUnlocked(product.lbs);

              return (
                <div
                  key={product.lbs}
                  className={`group relative border rounded-lg overflow-hidden transition-all ${isUnlocked
                    ? "border-[#B8860B]/30 hover:border-[#B8860B] hover:shadow-lg hover:shadow-[#B8860B]/10"
                    : "border-gray-200 opacity-70"
                    }`}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isUnlocked ? (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-medium px-2 py-1 rounded">
                        ✓ Unlocked
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        {/* <Lock className="w-8 h-8 text-white" strokeWidth={1.5} /> */}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                          {product.lbs} lbs Club
                        </p>
                        {/* <h5 className="font-semibold text-sm mt-1">{product.name}</h5> */}
                      </div>
                      <span className="font-bold text-[#B8860B]">{product.price}</span>
                    </div>

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