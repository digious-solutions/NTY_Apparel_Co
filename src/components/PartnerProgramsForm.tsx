// components/PartnerProgramsForm.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://ghostwhite-scorpion-772089.hostingersite.com";

const FOLLOWER_RANGES = ["< 1,000", "1,000 – 5,000", "5,000 – 10,000", "10,000 – 50,000", "50,000 – 100,000", "100,000 – 500,000", "500,000+"];
const FIND_OPTIONS = ["Instagram", "TikTok", "YouTube", "Friend / referral", "Search engine", "Already a customer", "Other"];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const PartnerProgramsForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialHandles, setSocialHandles] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [tiktokFollowers, setTiktokFollowers] = useState("");
  const [totalFollowersRange, setTotalFollowersRange] = useState("");
  const [platformInfo, setPlatformInfo] = useState("");
  const [howDidYouFind, setHowDidYouFind] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !phone || !socialHandles || !howDidYouFind) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/affiliate/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          socialHandles: socialHandles.trim(),
          instagramFollowers: instagramFollowers ? parseInt(instagramFollowers, 10) : null,
          tiktokFollowers: tiktokFollowers ? parseInt(tiktokFollowers, 10) : null,
          totalFollowersRange: totalFollowersRange || null,
          platformInfo: platformInfo.trim() || null,
          howDidYouFind,
          additionalNotes: additionalNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
      toast.success("Application received — pending review");
      onSuccess?.();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="apply-section" className="relative py-28 md:py-40 px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 bg-foreground" />
      <div className="relative z-10 max-w-xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.p custom={0} variants={fadeUp} className="font-body text-[10px] tracking-[0.5em] uppercase text-background/40 mb-6">
            Apply Now
          </motion.p>
          <motion.h2 custom={1} variants={fadeUp} className="font-heading text-5xl md:text-7xl tracking-wider text-background mb-4">
            JOIN THE TEAM
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="font-body text-sm text-background/50 leading-relaxed mb-10">
            Fill out the form below and we'll get back to you within 48 hours.
          </motion.p>

          {!submitted ? (
            <motion.form custom={3} variants={fadeUp} onSubmit={handleSubmit} className="space-y-5 text-left">
              {/* First Name + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">First Name *</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={60}
                    className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
                </div>
                <div>
                  <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Last Name *</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={60}
                    className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
              </div>

              {/* Phone */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Phone Number *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" maxLength={30}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
              </div>

              {/* Social Handles */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Social Handle(s) *</label>
                <input type="text" required value={socialHandles} onChange={(e) => setSocialHandles(e.target.value)} placeholder="@yourhandle on Instagram, TikTok, etc." maxLength={200}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
              </div>

              {/* Followers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Instagram Followers *</label>
                  <input type="number" required min="0" value={instagramFollowers} onChange={(e) => setInstagramFollowers(e.target.value)} placeholder="e.g. 5000"
                    className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
                </div>
                <div>
                  <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">TikTok Followers *</label>
                  <input type="number" required min="0" value={tiktokFollowers} onChange={(e) => setTiktokFollowers(e.target.value)} placeholder="e.g. 12000"
                    className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors" />
                </div>
              </div>

              {/* Total Followers Range */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Total Followers (All Platforms)</label>
                <select value={totalFollowersRange} onChange={(e) => setTotalFollowersRange(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors">
                  <option value="" className="bg-foreground text-background">Select a range (optional)…</option>
                  {FOLLOWER_RANGES.map((r) => <option key={r} value={r} className="bg-foreground text-background">{r}</option>)}
                </select>
              </div>

              {/* Platform Info */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Platform / Audience Info</label>
                <textarea value={platformInfo} onChange={(e) => setPlatformInfo(e.target.value)} placeholder="Tell us about your audience, niche, content style, etc." rows={3} maxLength={1000}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors resize-none" />
              </div>

              {/* How Did You Find Us */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">How Did You Find Us? *</label>
                <select required value={howDidYouFind} onChange={(e) => setHowDidYouFind(e.target.value)}
                  className="w-full bg-background/10 border border-background/20 text-background font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors">
                  <option value="" className="bg-foreground text-background">Select an option…</option>
                  {FIND_OPTIONS.map((r) => <option key={r} value={r} className="bg-foreground text-background">{r}</option>)}
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="font-body text-[11px] tracking-[0.2em] uppercase text-background/60 block mb-2">Additional Notes</label>
                <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Anything else you'd like us to know?" rows={3} maxLength={1000}
                  className="w-full bg-background/10 border border-background/20 text-background placeholder:text-background/30 font-body text-sm px-4 py-3 focus:outline-none focus:border-background/60 transition-colors resize-none" />
              </div>

              <button type="submit" disabled={loading}
                className="group w-full relative bg-background text-foreground font-body text-sm tracking-[0.2em] uppercase px-8 py-4 overflow-hidden disabled:opacity-50">
                <span className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </motion.form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="border border-gold/40 bg-gradient-to-br from-gold-soft/10 to-transparent p-10 space-y-5">
              <p className="font-heading text-3xl tracking-wider text-background">APPLICATION PENDING</p>
              <p className="font-body text-sm text-background/70 leading-relaxed">
                Thanks for applying to the NTY Partner Program. Your application is under review — our team will get back to you within 48 hours.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerProgramsForm;