// pages/SetPassword.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ Verify token on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid invite link');
        }

        setEmail(data.data.email);
        setValid(true);
      } catch (error) {
        console.error('Verify error:', error);
        setValid(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set password.");
      }

      // ✅ Store auth data
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));

      setSuccess(true);
      toast.success("Password set successfully!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/account';
      }, 2000);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl tracking-widest mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            INVALID LINK
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This invite link is invalid or has expired. Please contact support.
          </p>
          <a
            href="https://ntygear.com"
            className="inline-block bg-foreground text-background px-6 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-90"
          >
            Go to Website
          </a>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl tracking-widest mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            PASSWORD SET!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl tracking-widest mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          SET YOUR PASSWORD
        </h1>
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider">
          Create your account to access your Bench Club dashboard
        </p>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
              className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background py-3 text-sm tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Setting..." : "Set Password & Continue"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default SetPassword;