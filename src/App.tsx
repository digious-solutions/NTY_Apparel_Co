import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import { AdminGuard } from "./components/AdminGuard.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import SupportTab from "./components/SupportTab.tsx";
import { RefTracker } from "./components/RefTracker.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";


// Lazy-loaded routes to keep the initial bundle small + fast first paint.
const Shop = lazy(() => import("./pages/Shop.tsx"));
const Product = lazy(() => import("./pages/Product.tsx"));
const Story = lazy(() => import("./pages/Story.tsx"));
const FAQ = lazy(() => import("./pages/FAQ.tsx"));
const Partners = lazy(() => import("./pages/Partners.tsx"));
const BenchClub = lazy(() => import("./pages/BenchClub.tsx"));
const BenchClubShop = lazy(() => import("./pages/BenchClubShop.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const NattyVerified = lazy(() => import("./pages/NattyVerified.tsx"));
const PartnerProgramsForm = lazy(() => import("./pages/PartnerProgram.tsx"));
const SetPassword = lazy(() => import("./pages/SetPassword.tsx"));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center text-xs tracking-widest uppercase text-muted-foreground">
    Loading…
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <RefTracker />
          <SupportTab />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/story" element={<Story />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/bench-club" element={<BenchClub />} />
              <Route path="/bench-club-shop" element={<BenchClubShop />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/natty-verification" element={<NattyVerified />} />
              <Route path="/partner-program" element={<PartnerProgramsForm />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
