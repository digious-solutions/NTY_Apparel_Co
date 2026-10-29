import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthMode = "login" | "signup";
type ResetStep = "email" | "otp" | "password";

interface NattyVerifiedAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";
const fieldClassName = "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20";

const NattyVerifiedAuthDialog = ({ open, onOpenChange }: NattyVerifiedAuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const sendWelcomeEmail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim().split(" ")[0] || name.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Welcome email send failed:", error);
      }
    } catch (error) {
      console.error("Welcome email error:", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

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
        await signUp(name.trim(), email.trim(), password);
        await sendWelcomeEmail();
      } else {
        await signIn(email.trim(), password);
      }
      onOpenChange(false);
    } catch {
      // AuthContext displays the authentication error.
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.toLowerCase().trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send OTP.");
      setResetStep("otp");
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.toLowerCase().trim(), otp: otp.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invalid OTP.");
      setResetStep("password");
      toast.success("OTP verified! Please set your new password.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setResetLoading(true);
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
      if (!response.ok) throw new Error(data.error || "Failed to reset password.");

      toast.success("Password reset successfully! Please login.");
      setResetStep("email");
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowForgotPassword(false);
      setMode("login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordFlow = () => {
    setShowForgotPassword(false);
    setResetStep("email");
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const toggleMode = () => {
    setMode(current => current === "login" ? "signup" : "login");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-gray-200 bg-white p-6 text-gray-900 sm:p-8">
        <DialogHeader className="mb-2 pr-6 text-left">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#B8860B]">NATTY VERIFIED</p>
          <DialogTitle className="font-heading text-2xl tracking-wider">
            {showForgotPassword
              ? "RESET PASSWORD"
              : mode === "login" ? "SIGN IN TO APPLY" : "CREATE YOUR ACCOUNT"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {!showForgotPassword
              ? mode === "login" ? "Log in to continue your application." : "Join the NTY community to apply."
              : resetStep === "email" ? "Enter your email to receive a password reset code."
                : resetStep === "otp" ? `Enter the 6-digit code sent to ${resetEmail}.`
                  : "Set a new password for your account."}
          </DialogDescription>
        </DialogHeader>

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={event => setName(event.target.value)}
                required
                autoComplete="name"
                className={fieldClassName}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              autoComplete="email"
              className={fieldClassName}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`${fieldClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(current => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {mode === "signup" && (
              <>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`${fieldClassName} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(current => !current)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </>
            )}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setResetStep("email"); setShowForgotPassword(true); }}
                  className="text-sm text-gray-600 underline-offset-4 hover:text-[#B8860B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#B8860B] px-4 py-3 text-sm font-semibold tracking-[0.15em] text-white transition hover:bg-[#a0750a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "PLEASE WAIT..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
            <p className="pt-1 text-center text-sm text-gray-600">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button type="button" onClick={toggleMode} disabled={loading} className="font-semibold text-[#9a6d00] hover:underline">
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </form>
        ) : resetStep === "email" ? (
          <form onSubmit={event => { event.preventDefault(); void sendOtp(); }} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={event => setResetEmail(event.target.value)}
              required
              autoComplete="email"
              className={fieldClassName}
            />
            <button type="submit" disabled={resetLoading} className="w-full rounded-md bg-[#B8860B] px-4 py-3 text-sm font-semibold tracking-widest text-white hover:bg-[#a0750a] disabled:opacity-60">
              {resetLoading ? "SENDING..." : "SEND OTP"}
            </button>
            <button type="button" onClick={resetPasswordFlow} className="w-full text-sm text-gray-600 hover:text-gray-900">
              Back to sign in
            </button>
          </form>
        ) : resetStep === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              inputMode="numeric"
              className={`${fieldClassName} text-center text-xl tracking-[0.5em]`}
            />
            <button type="submit" disabled={resetLoading || otp.length !== 6} className="w-full rounded-md bg-[#B8860B] px-4 py-3 text-sm font-semibold tracking-widest text-white hover:bg-[#a0750a] disabled:opacity-60">
              {resetLoading ? "VERIFYING..." : "VERIFY OTP"}
            </button>
            <button type="button" onClick={() => void sendOtp()} disabled={resetLoading} className="w-full text-sm text-gray-600 hover:text-gray-900">
              Resend OTP
            </button>
            <button type="button" onClick={resetPasswordFlow} className="w-full text-sm text-gray-600 hover:text-gray-900">
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {[{
              label: "New Password",
              value: newPassword,
              update: setNewPassword,
              visible: showNewPassword,
              toggle: () => setShowNewPassword(current => !current),
            }, {
              label: "Confirm New Password",
              value: confirmNewPassword,
              update: setConfirmNewPassword,
              visible: showConfirmNewPassword,
              toggle: () => setShowConfirmNewPassword(current => !current),
            }].map(field => (
              <div key={field.label} className="relative">
                <input
                  type={field.visible ? "text" : "password"}
                  placeholder={field.label}
                  value={field.value}
                  onChange={event => field.update(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={`${fieldClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={field.toggle}
                  aria-label={field.visible ? `Hide ${field.label.toLowerCase()}` : `Show ${field.label.toLowerCase()}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {field.visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            ))}
            <button type="submit" disabled={resetLoading || !newPassword || !confirmNewPassword} className="w-full rounded-md bg-[#B8860B] px-4 py-3 text-sm font-semibold tracking-widest text-white hover:bg-[#a0750a] disabled:opacity-60">
              {resetLoading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
            <button type="button" onClick={resetPasswordFlow} className="w-full text-sm text-gray-600 hover:text-gray-900">
              Back to sign in
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NattyVerifiedAuthDialog;
