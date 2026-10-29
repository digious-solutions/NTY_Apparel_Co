import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBenchClubMembership } from "@/hooks/useBenchClubMembership";

const BenchClubShop = () => {
  const { isMember, loading } = useBenchClubMembership();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Bench Club Items — Members Only | NTY";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="max-w-md text-center">
            <Lock className="w-10 h-10 mx-auto mb-6 text-foreground/40" strokeWidth={1.5} />
            <h1 className="font-heading text-3xl md:text-4xl tracking-wider text-foreground mb-4">
              MEMBERS ONLY
            </h1>
            <p className="font-body text-sm text-muted-foreground mb-8 leading-relaxed">
              The Bench Club shop is reserved for verified members. Apply to the NATTY VERIFIED to unlock access.
            </p>
            <button
              onClick={() => navigate("/bench-club")}
              className="bg-foreground text-background font-body text-xs tracking-[0.2em] uppercase px-8 py-3 hover:opacity-90 transition-opacity"
            >
              Apply Now
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-6 md:px-12 py-24 md:py-32 max-w-7xl mx-auto w-full">
        <header className="mb-16 md:mb-24">
          <p className="font-body text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-4">
            Members Only
          </p>
          <h1 className="font-heading text-5xl md:text-7xl tracking-wider text-foreground">
            BENCH CLUB ITEMS
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-6 max-w-xl">
            Exclusive apparel and gear reserved for verified Bench Club members. New drops coming soon.
          </p>
        </header>

        <div className="border border-border py-32 text-center">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Inventory coming soon
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BenchClubShop;
