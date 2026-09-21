import UrgencyBanner from "@/components/UrgencyBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerProgramsForm from "@/components/PartnerProgramsForm";
const NattyVerified = () => {
  return (
    <div className="min-h-screen bg-background">
      <UrgencyBanner />
      <Header />
      <PartnerProgramsForm />
      <Footer />
    </div>
  );
};

export default NattyVerified;
