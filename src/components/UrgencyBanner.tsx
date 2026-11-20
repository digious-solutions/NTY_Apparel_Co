const UrgencyBanner = () => {
  return (
    <div className="bg-foreground py-2 overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="mx-8 text-xs font-body tracking-[0.2em] uppercase text-background">
            DROP 2 PRESALE LIVE - $15 OFF FOR VERIFIED MEMBERS
          </span>
        ))}
      </div>
    </div>
  );
};

export default UrgencyBanner;
