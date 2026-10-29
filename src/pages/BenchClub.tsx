import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UrgencyBanner from "@/components/UrgencyBanner";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Instagram } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import patch225 from "@/assets/patch-225.jpg.asset.json";
import patch315 from "@/assets/patch-315.jpg.asset.json";
import patch405 from "@/assets/patch-405.jpg.asset.json";
import NattyVerifiedForm from "@/components/NattyVerifiedForm";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const tiers = [
  { number: "225", name: "225 Club", desc: "The foundation of the NATTY VERIFIED.", patch: patch225.url },
  { number: "315", name: "315 Club", desc: "Elite-level natural pressing strength.", patch: patch315.url },
  { number: "405", name: "405 Club", desc: "Reserved for the rare few.", patch: patch405.url },
];

const qualifyRules = [
  "Clear visible weight on the bar",
  "Full range of motion",
  "Bar must touch the chest",
  "Full lockout required",
  "No Smith machine lifts",
  "Video must be continuous and unedited",
  "Spotters may not assist the lift",
];

const memberPerks = [
  "Exclusive Bench Club apparel",
  "Bench Club items",
  "Official member recognition",
  "Member numbers",
  "Future Bench Club releases",
  "Priority access to Natty Bench Club drops",
];

const BenchClub = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [tier, setTier] = useState("225");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedHandle = handle.trim();

    if (!trimmedName || !normalizedEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("bench_club_applications")
        .insert({
          name: trimmedName,
          email: normalizedEmail,
          instagram_handle: trimmedHandle || null,
          bench_tier: parseInt(tier, 10),
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Registration received.");

      void supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "bench-club-received",
          recipientEmail: normalizedEmail,
          idempotencyKey: `bench-club-received-${normalizedEmail}-${Date.now()}`,
          templateData: { first_name: trimmedName.split(" ")[0] },
        },
      }).catch(() => {
        // Registration succeeds even if the email send is temporarily unavailable.
      });

      setName("");
      setEmail("");
      setHandle("");
      setTier("225");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToJoin = () => {
    document.getElementById("join-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <UrgencyBanner />
      <Header />

      {/* Hero */}
      <section className="relative pt-8 pb-20 md:pt-24 md:pb-40 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span className="font-heading text-[14rem] md:text-[26rem] text-foreground/[0.03] leading-none tracking-wider select-none">
            225
          </span>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-6 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-gold inline-block" />
            Naturals Only
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-[3rem] sm:text-[4.5rem] md:text-[7rem] lg:text-[9.5rem] leading-[0.85] tracking-wider text-foreground"
          >
            THE NATTY
            <br />
            BENCH PRESS
            <br />
            <span className="text-gold/70">CLUB</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="font-body text-base md:text-lg text-gold-soft leading-relaxed mt-8 max-w-xl"
          >
            Clothing you can't just buy.<br />You have to earn.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            onClick={scrollToJoin}
            className="group relative inline-flex items-center gap-3 bg-foreground text-background font-body text-sm tracking-[0.2em] uppercase px-10 py-4 mt-12 overflow-hidden"
          >
            <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 flex items-center gap-3">
              Register Membership
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.button>
        </div>
      </section>

      {/* Intro: Earned not purchased */}
      <section className="py-24 md:py-36 px-6 md:px-12 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-6"
          >
            Earned. Not Given.
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={1} variants={fadeUp}
            className="font-heading text-4xl md:text-6xl tracking-wider text-foreground mb-8"
          >
            MEMBERSHIP IS <span className="text-gold/80">EARNED</span>
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={2} variants={fadeUp}
            className="font-body text-base text-foreground/80 leading-relaxed mb-6"
          >
            The NATTY VERIFIED was created to recognize natural lifters who have earned one of the most respected milestones in strength training: a legitimate 225-pound bench press and beyond.
          </motion.p>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={3} variants={fadeUp}
            className="font-body text-base text-foreground/80 leading-relaxed"
          >
            In a world where almost every fitness brand can be bought by anyone, the NATTY VERIFIED is different.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={4} variants={fadeUp}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 font-heading text-xl md:text-2xl tracking-wider"
          >
            <span className="text-gold">EARNED.</span>
            <span className="text-foreground/60">NOT PURCHASED.</span>
            <span className="text-foreground/60">NOT CLAIMED.</span>
            <span className="text-gold">VERIFIED.</span>
          </motion.div>
        </div>
      </section>

      {/* Why 225 Matters — LIGHT SECTION */}
      <section className="py-24 md:py-36 px-6 md:px-12 bg-[hsl(40_30%_96%)] border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="text-center mb-12"
          >
            <p className="font-body text-[10px] tracking-[0.5em] uppercase text-[hsl(38_60%_42%)] mb-4">The Standard</p>
            <h2 className="font-heading text-4xl md:text-6xl tracking-wider text-[hsl(0_0%_8%)]">
              WHY <span className="text-[hsl(38_60%_42%)]">225</span> MATTERS
            </h2>
          </motion.div>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={1} variants={fadeUp}
            className="font-body text-base text-[hsl(0_0%_15%)] leading-relaxed mb-6"
          >
            For decades, a 225-pound bench press has represented a major milestone in strength culture. It's one of the most respected benchmarks in the gym because most people never reach it — especially with strict form and without performance-enhancing drugs.
          </motion.p>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={2} variants={fadeUp}
            className="font-body text-base text-[hsl(0_0%_15%)] leading-relaxed mb-8"
          >
            The NATTY VERIFIED exists to recognize lifters who earned that level of strength naturally through:
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={3} variants={fadeUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            {["Discipline", "Consistency", "Hard Work", "Years of Training"].map((w) => (
              <div key={w} className="border border-[hsl(0_0%_8%)]/20 bg-white/60 px-4 py-5 text-center hover:border-[hsl(38_60%_42%)] transition-colors">
                <p className="font-body text-xs uppercase tracking-[0.2em] text-[hsl(0_0%_8%)]">{w}</p>
              </div>
            ))}
          </motion.div>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={4} variants={fadeUp}
            className="font-body text-base text-[hsl(0_0%_15%)] leading-relaxed text-center"
          >
            This is not about perfection. <span className="text-[hsl(38_60%_42%)] font-semibold">This is about earning respect.</span>
          </motion.p>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24 md:py-36 px-6 md:px-12 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-4">Bench Club Levels</p>
            <h2 className="font-heading text-4xl md:text-6xl tracking-wider text-foreground">
              THE <span className="text-gold">TIERS</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {tiers.map((t, i) => (
              <motion.div
                key={t.number}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                custom={i} variants={fadeUp}
                className="border border-border p-8 md:p-10 hover:border-foreground/40 transition-colors group flex flex-col"
              >
                <div className="flex items-center justify-between gap-4 mb-8">
                  <p className="font-heading text-6xl md:text-7xl tracking-tight text-foreground group-hover:text-accent transition-colors leading-none">
                    {t.number}
                  </p>
                  {t.patch ? (
                    <img
                      src={t.patch}
                      alt={`${t.number} LB Club patch`}
                      className="w-24 h-28 md:w-28 md:h-32 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                    />
                  ) : (
                    <div
                      className="w-24 h-28 md:w-28 md:h-32 flex items-center justify-center border-2 border-dashed border-foreground/20 rounded-md bg-foreground/[0.03]"
                      aria-label={`${t.number} patch coming soon`}
                    >
                      <span className="font-body text-[9px] uppercase tracking-[0.2em] text-foreground/40 text-center px-2">
                        Patch<br/>Coming Soon
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-body text-sm font-semibold uppercase tracking-[0.25em] text-gold mb-5">{t.name}</p>
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* How to Qualify */}
      <section className="py-24 md:py-36 px-6 md:px-12 bg-foreground border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="text-center mb-12"
          >
            <p className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-4">Verification</p>
            <h2 className="font-heading text-4xl md:text-6xl tracking-wider text-background">
              HOW TO <span className="text-gold">QUALIFY</span>
            </h2>
            <p className="font-body text-sm text-background/80 mt-6 leading-relaxed">
              Submit an uncut video showing a successful lift that meets the following standards:
            </p>
          </motion.div>

          <div className="space-y-2">
            {qualifyRules.map((rule, i) => (
              <motion.div
                key={rule}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }}
                custom={i} variants={fadeUp}
                className="flex items-center gap-4 border border-background/10 px-5 py-4"
              >
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <p className="font-body text-sm text-background">{rule}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            custom={qualifyRules.length} variants={fadeUp}
            className="font-body text-xs text-background/70 mt-8 text-center uppercase tracking-[0.2em]"
          >
            All submissions are reviewed individually before approval.
          </motion.p>
        </div>
      </section>

      <NattyVerifiedForm />

      {/* How to Submit */}
      <section className="py-24 md:py-36 px-6 md:px-12 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-4">The Process</p>
            <h2 className="font-heading text-4xl md:text-6xl tracking-wider text-foreground">
              HOW TO <span className="text-gold">SUBMIT</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              custom={0} variants={fadeUp}
              className="border border-border p-8"
            >
              <p className="font-heading text-3xl tracking-wider text-foreground mb-4">STEP 01</p>
              <p className="font-body text-sm text-foreground/80 leading-relaxed mb-4">
                Post your bench video on Instagram or TikTok and tag <span className="text-gold font-semibold">@NTYGear</span>.
              </p>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-4">— OR —</p>
              <p className="font-body text-sm text-foreground/80 leading-relaxed flex items-start gap-2">
                <Instagram className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                Send your submission directly through DM to <span className="text-gold font-semibold">@NTYGear</span>.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              custom={1} variants={fadeUp}
              className="border border-border p-8"
            >
              <p className="font-heading text-3xl tracking-wider text-foreground mb-4">STEP 02</p>
              <p className="font-body text-sm text-foreground/80 leading-relaxed mb-4">
                Once approved, complete the official Bench Club Registration Form below. This allows us to:
              </p>
              <ul className="space-y-2">
                {[
                  "officially register your membership",
                  "assign your member number",
                  "notify you about future Bench Club drops",
                  "unlock access to Bench Club apparel and items",
                ].map((s) => (
                  <li key={s} className="font-body text-xs text-foreground/80 flex items-start gap-2">
                    <span className="text-gold mt-0.5">—</span> {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            custom={2} variants={fadeUp}
            className="border-l-2 border-gold bg-muted/30 p-6"
          >
            <p className="font-body text-xs uppercase tracking-[0.2em] text-gold mb-2">Please Note</p>
            <p className="font-body text-sm text-foreground/80 leading-relaxed">
              Submitting the registration form alone does <span className="text-gold font-semibold">NOT</span> guarantee acceptance into the Bench Press Club. You must first submit and pass video verification through <span className="text-gold font-semibold">@NTYGear</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Member Perks — LIGHT SECTION */}
      <section className="py-24 md:py-36 px-6 md:px-12 bg-[hsl(40_30%_96%)] border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={0} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="font-body text-[10px] tracking-[0.5em] uppercase text-[hsl(38_60%_42%)] mb-4">Member Access</p>
            <h2 className="font-heading text-4xl md:text-6xl tracking-wider text-[hsl(0_0%_8%)]">
              OFFICIAL MEMBERS <span className="text-[hsl(38_60%_42%)]">RECEIVE</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-3">
            {memberPerks.map((perk, i) => (
              <motion.div
                key={perk}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }}
                custom={i} variants={fadeUp}
                className="flex items-center gap-4 border border-[hsl(0_0%_8%)]/15 bg-white px-5 py-5 hover:border-[hsl(38_60%_42%)] transition-colors"
              >
                <span className="font-heading text-lg text-[hsl(38_60%_42%)]">0{i + 1}</span>
                <p className="font-body text-sm text-[hsl(0_0%_10%)]">{perk}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration form */}
      {/* <section id="join-section" className="relative py-28 md:py-40 px-6 md:px-12 overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-foreground" />
        <div className="relative z-10 max-w-xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.p custom={0} variants={fadeUp} className="font-body text-[10px] tracking-[0.5em] uppercase text-gold mb-6">
              Official Registration
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-heading text-4xl md:text-6xl tracking-wider text-background mb-4">
              BENCH CLUB FORM
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="font-body text-sm text-background/70 leading-relaxed mb-10">
              Submit only after your video has been verified through <span className="text-gold font-semibold">@NTYGear</span>.
            </motion.p>

            {!submitted ? (
              <motion.form custom={3} variants={fadeUp} onSubmit={handleSubmit} className="space-y-4 text-left">
                <input
                  type="text" required placeholder="Full name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-5 py-4 focus:outline-none focus:border-background/50 transition-colors"
                />
                <input
                  type="email" required placeholder="Email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-5 py-4 focus:outline-none focus:border-background/50 transition-colors"
                />
                <input
                  type="text" placeholder="Instagram / TikTok handle"
                  value={handle} onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-5 py-4 focus:outline-none focus:border-background/50 transition-colors"
                />
                <select
                  value={tier} onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background font-body text-sm px-5 py-4 focus:outline-none focus:border-background/50 transition-colors"
                >
                  
                  <option value="225" className="bg-foreground text-background">225 Club</option>
                  <option value="315" className="bg-foreground text-background">315 Club</option>
                  <option value="405" className="bg-foreground text-background">405 Club</option>
                </select>
                <button
                  type="submit" disabled={loading}
                  className="group w-full relative bg-background text-foreground font-body text-sm tracking-[0.2em] uppercase px-8 py-4 overflow-hidden disabled:opacity-50"
                >
                  <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? "Submitting..." : "Submit Registration"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="border border-background/20 p-10"
              >
                <p className="font-heading text-3xl tracking-wider text-gold mb-3">REGISTRATION RECEIVED.</p>
                <p className="font-body text-sm text-background/70">We'll confirm your membership after video verification through @NTYGear.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section> */}

      

      {/* Closing */}
      <section className="py-24 md:py-36 px-6 md:px-12 border-t border-border text-center">
        <motion.h2
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          custom={0} variants={fadeUp}
          className="font-heading text-4xl md:text-7xl tracking-wider text-foreground mb-6"
        >
          EARNED. <span className="text-gold/80">NOT GIVEN.</span>
        </motion.h2>
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          custom={1} variants={fadeUp}
          className="font-body text-base text-foreground/80 max-w-xl mx-auto leading-relaxed mb-8"
          >
            The NATTY VERIFIED exists to celebrate natural lifters who earned their strength the hard way.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            custom={2} variants={fadeUp}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-heading text-lg md:text-2xl tracking-wider"
          >
            <span className="text-foreground/60">NO SHORTCUTS.</span>
            <span className="text-foreground/60">NO FAKE CLAIMS.</span>
            <span className="text-foreground/60">NO BOUGHT STATUS.</span>
            <span className="text-gold">JUST EARNED RESPECT.</span>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default BenchClub;
