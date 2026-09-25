// pages/Auth.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

  // ✅ Redirect logged-in users to the dashboard for their role.
  useEffect(() => {
    if (authLoading) return;

    if (user && !redirecting) {
      setRedirecting(true);

      const destination = user.role === 'admin' ? '/admin' : '/account';

      console.log(`✅ Redirecting to: ${destination} (role: ${user.role})`);

      setTimeout(() => {
        window.location.href = destination;
      }, 100);
    }
  }, [user, authLoading, navigate, redirecting]);

  // ✅ Send Welcome Email
  const sendWelcomeEmail = async (email: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/api/email/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim().split(" ")[0] || name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Welcome email send failed:", error);
        return false;
      }

      console.log("✅ Welcome email sent to:", email);
      return true;
    } catch (error) {
      console.error("Welcome email error:", error);
      return false;
    }
  };


  // ✅ Handle Sign In / Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authLoading) return;

    if (mode === "signup" && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(name, email, password);

        // ✅ Send welcome email after successful signup
        await sendWelcomeEmail(email, name);
        toast.success("Welcome! Please check your email.");

      } else {
        await signIn(email, password);
      }
      // ✅ After login, useEffect redirects to the role-based dashboard.
    } catch (error) {
      console.error('❌ Form error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Send OTP for Forgot Password
  const handleSendOtp = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }

      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.toLowerCase().trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP.");
      }

      setOtpVerified(true);
      toast.success("OTP verified! Please set your new password.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ✅ Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success("Password reset successfully! Please login.");
      setShowForgotPassword(false);
      setOtpSent(false);
      setOtpVerified(false);
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ✅ Reset Forgot Password Flow
  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setOtpSent(false);
    setOtpVerified(false);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotLoading(false);
  };

  // ✅ Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmNewPasswordVisibility = () => setShowConfirmNewPassword(!showConfirmNewPassword);

  // ✅ Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // ✅ Forgot Password Flow
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-md mx-auto px-6 py-16">
          <button
            onClick={resetForgotPassword}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          <h1 className="text-3xl tracking-widest mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            RESET PASSWORD
          </h1>
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider">
            {!otpSent ? "Enter your email to receive OTP" :
              !otpVerified ? "Enter the 6-digit OTP sent to your email" :
                "Set your new password"}
          </p>

          {!otpSent ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-foreground text-background py-3 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-50"
              >
                {forgotLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : !otpVerified ? (
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4">
              <p className="text-xs text-muted-foreground mb-2">
                OTP sent to <span className="font-medium text-foreground">{resetEmail}</span>
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground text-center text-2xl tracking-[0.5em]"
              />
              <button
                type="submit"
                disabled={forgotLoading || otp.length < 6}
                className="w-full bg-foreground text-background py-3 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-50"
              >
                {forgotLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition"
              >
                Resend OTP
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground pr-12"
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground pr-12"
                />
                <button
                  type="button"
                  onClick={toggleConfirmNewPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={forgotLoading || !newPassword || !confirmNewPassword}
                className="w-full bg-foreground text-background py-3 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-50"
              >
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </main>
      </div>
    );
  }

  // ✅ Main Auth Page
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl tracking-widest mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider">
          {mode === "login" ? "Access your rewards & orders" : "Join the NTY community"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground pr-12"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground pr-12"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full bg-foreground text-background py-3 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className="mt-6 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition"
          disabled={loading}
        >
          {mode === "login" ? "New here? Create account" : "Have an account? Sign in"}
        </button>

        <div className="mt-8">
          <Link to="https://ntygear.com" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Auth;