// components/Header.tsx
import { useEffect, useState } from "react";
import { Menu, X, Search, User, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { to: "/account?tab=shop", label: "Shop" },
  { to: "https://ntygear.com/pages/the-nty-story", label: "The NTY Story" },
  { to: "https://ntygear.com/pages/partners", label: "Partner Program" },
  { to: "https://ntygear.com/pages/natty-verified", label: "Natty Verified" },
  { to: "https://ntygear.com/pages/contact-us", label: "Contact Us" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Handle Account Icon Click - Role based redirect
  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      // If not logged in, go to auth
      navigate("/auth");
      return;
    }

    // ✅ Role based redirect
    if (user.role === 'admin') {
      navigate("/admin");
    } else if (user.role === 'customer') {
      navigate("/account");
    } else {
      // Fallback
      navigate("/account");
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="px-6 lg:px-12 py-5">
        <div className="flex items-center justify-between">
          {/* Left — Logo + Mobile/Tablet toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="https://ntygear.com" className="text-[1.35rem] lg:text-[1.65rem] tracking-widest text-foreground leading-none -ml-3" style={{ fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif" }}>
              NATTY
            </Link>
          </div>

          {/* Center — Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-body text-sm tracking-[0.15em] uppercase text-foreground hover:text-accent transition-colors duration-200 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — Icons */}
          <div className="flex items-center gap-5">
            <button aria-label="Search" className="text-foreground hover:text-accent transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* ✅ Account Icon with Role-based redirect */}
            <button
              onClick={handleAccountClick}
              aria-label="Account"
              className="text-foreground hover:text-accent transition-colors relative"
            >
              <User className="w-5 h-5" />
              {/* {user && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              )} */}
            </button>

            <button
              onClick={() => { window.location.href = "https://ntygear.com/cart"; }}
              aria-label="Cart"
              className="relative text-foreground hover:text-accent transition-colors"
            >
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="var(--icon-stroke-width)"
                  d="M3.392 6.875h13.216v8.016c0 .567-.224 1.112-.624 1.513-.4.402-.941.627-1.506.627H5.522a2.13 2.13 0 0 1-1.506-.627 2.15 2.15 0 0 1-.624-1.513zM8.818 2.969h2.333c.618 0 1.211.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.313c0-.622.246-1.218.683-1.658a2.33 2.33 0 0 1 1.65-.686">
                </path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet nav */}
      {mobileOpen && (
        <nav className="lg:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-body text-sm tracking-[0.15em] uppercase text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;