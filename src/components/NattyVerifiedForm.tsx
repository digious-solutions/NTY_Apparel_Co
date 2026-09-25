// components/BenchClubForm.tsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Upload, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface BenchClubFormProps {
  onSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

const BenchClubForm = ({ onSuccess }: BenchClubFormProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    socialHandle: "",
    phoneNumber: "",
    lift: "",
    weightTier: "",
    additionalNotes: "",
    videoFile: null as File | null,
    confirmVideo: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<"idle" | "uploading" | "submitting" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const liftOptions = ["Bench Press", "Deadlift"];
  const weightOptions = ["225", "315", "405"];

  // ✅ Auto-fill user data when logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video file size must be less than 100MB.");
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
      setUploadProgress(0);
      setStep("idle");
    }
  };

  // ✅ Upload Video with Progress Tracking
  const uploadVideo = async (file: File): Promise<string> => {
    const token = localStorage.getItem('auth_token');
    const videoFormData = new FormData();
    videoFormData.append("video", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data.video_url);
          } catch (error) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || "Video upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error occurred"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", `${API_URL}/api/bench-club/upload-video`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(videoFormData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!user) {
      toast.error("Please login first to submit your application.");
      navigate("/auth");
      return;
    }

    const { fullName, email, socialHandle, lift, weightTier, videoFile, confirmVideo } = formData;

    if (!fullName.trim() || !email.trim() || !socialHandle.trim() || !lift || !weightTier || !videoFile || !confirmVideo) {
      toast.error("Please fill in all required fields and upload your video.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setStep("uploading");

    try {
      const token = localStorage.getItem('auth_token');

      // 1. Upload video with progress
      let videoUrl: string;
      try {
        videoUrl = await uploadVideo(videoFile);
        setUploadProgress(100);
        toast.success("Video uploaded!");
      } catch (uploadError) {
        console.error("Video upload failed:", uploadError);
        toast.error(uploadError instanceof Error ? uploadError.message : "Failed to upload video.");
        setLoading(false);
        setStep("idle");
        setUploadProgress(0);
        return;
      }

      // 2. Submit application
      setStep("submitting");
      toast.info("Submitting application...");

      const response = await fetch(`${API_URL}/api/bench-club/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          socialHandle: socialHandle.trim(),
          phoneNumber: formData.phoneNumber || null,
          lift,
          weightTier: parseInt(weightTier, 10),
          videoUrl,
          additionalNotes: formData.additionalNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      setStep("done");
      setSubmitted(true);
      toast.success("Application submitted successfully!");

      // 3. Send confirmation email (background)
      try {
        await fetch(`${API_URL}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: fullName.trim().split(" ")[0],
            tier: weightTier,
            type: "bench-club-received",
          }),
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
      }

      onSuccess?.();

    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show login required message if not authenticated
  if (!authLoading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-200 text-center"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Please login to your account to submit your Natty Verified application.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-[#B8860B] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#a0750a] transition-colors"
          >
            Login to Apply
          </button>
        </div>
      </motion.div>
    );
  }

  // ✅ Show loading state
  if (authLoading) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-200 text-center">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8860B]"></div>
        </div>
      </div>
    );
  }

  // ✅ Show success message
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-gray-200 p-12 text-center rounded-xl shadow-lg"
      >
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h3 className="font-heading text-3xl tracking-wider text-[#B8860B] mb-4">
          APPLICATION RECEIVED
        </h3>
        <p className="font-body text-base text-gray-600 max-w-md mx-auto">
          We'll review your video and get back to you within 48 hours.
        </p>
      </motion.div>
    );
  }

  // ✅ Get button text based on step
  const getButtonText = () => {
    if (!loading) return "Submit Application";
    
    switch (step) {
      case "uploading":
        return `Uploading... ${uploadProgress}%`;
      case "submitting":
        return "Submitting...";
      case "done":
        return "Complete!";
      default:
        return "Please wait...";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-5 md:p-10 rounded-xl shadow-lg border border-gray-100"
    >
      <div className="max-w-[38rem] mx-auto">
        {/* User Info Banner */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Logged in as</p>
            <p className="text-sm text-green-700">{user?.email}</p>
          </div>
        </div>

        {/* Headers Section */}
        <div className="text-center mb-8">
          <p className="font-body text-[12px] md:text-[16px] tracking-[5px] uppercase text-[#B8860B] mb-[20px] font-semibold">
            OFFICIAL REGISTRATION
          </p>
          <h2 className="font-heading leading-[45px] text-[2.5rem] md:text-[4.5rem] md:leading-[4.5rem] tracking-wider text-black md:mb-2 ">
            NATTY VERIFIED
          </h2>
          <h3 className="font-heading mb-[20px] leading-[45px] text-[2.5rem] md:text-[4.5rem] md:leading-[4.5rem] tracking-wider text-[#B8860B] md:mb-4">
            CLUB REGISTRATION
          </h3>
          <p className="font-body text-[12px] md:text-sm text-gray-600 leading-relaxed">
            Submit only after your video has been verified through <span className="text-[#B8860B] font-semibold">@NTYGear</span>.
          </p>
          <p className="font-body text-[12px] md:text-sm text-gray-600 mt-2">
            All submissions are reviewed individually before approval
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
                FULL NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="eg: Jane smith"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 placeholder:text-gray-400 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
                EMAIL <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="jane@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 placeholder:text-gray-400 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Instagram / TikTok Handle */}
          <div>
            <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
              INSTAGRAM / TIKTOK HANDLE <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="socialHandle"
              placeholder="@jame"
              value={formData.socialHandle}
              onChange={handleInputChange}
              className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 placeholder:text-gray-400 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg"
              required
              disabled={loading}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
              PHONE NUMBER
            </label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="(555) 123-4567"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 placeholder:text-gray-400 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg"
              disabled={loading}
            />
            <p className="font-body text-xs text-gray-500 mt-1.5 leading-relaxed">
              Optional — highly recommended for exclusive text-only discounts, drops, and Natty Verified updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lift */}
            <div>
              <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
                LIFT <span className="text-red-500">*</span>
              </label>
              <select
                name="lift"
                value={formData.lift}
                onChange={handleInputChange}
                className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg appearance-none"
                required
                disabled={loading}
              >
                <option value="">Select an Option...</option>
                {liftOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Weight Tier */}
            <div>
              <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
                WEIGHT TIER <span className="text-red-500">*</span>
              </label>
              <select
                name="weightTier"
                value={formData.weightTier}
                onChange={handleInputChange}
                className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg appearance-none"
                required
                disabled={loading}
              >
                <option value="">Select an Option...</option>
                {weightOptions.map(opt => (
                  <option key={opt} value={opt}>{opt} lbs</option>
                ))}
              </select>
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
              YOUR VERIFICATION VIDEO <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
                disabled={loading}
              />
              <div className={`w-full border border-[#0003] bg-[#0000001a] text-gray-900 font-body text-sm px-5 py-3.5 flex items-center justify-between rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#B8860B] transition-colors'
                }`}>
                <span className={formData.videoFile ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.videoFile ? formData.videoFile.name : "Choose File"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-xs">|</span>
                  <span className="text-gray-400">No file chosen</span>
                  <Upload className={`w-4 h-4 text-[#B8860B]/60 ${loading ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            </div>

            {/* ✅ Upload Progress Bar - 0% to 100% */}
            {loading && step === "uploading" && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                    Uploading video...
                  </span>
                  <span className="text-xs font-medium text-[#B8860B]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-300 bg-[#B8860B]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {loading && step === "submitting" && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B8860B]" />
                  <span>Submitting your application...</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              name="confirmVideo"
              checked={formData.confirmVideo}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 accent-[#B8860B] cursor-pointer shrink-0"
              required
              disabled={loading}
            />
            <label className="font-body text-sm text-gray-600 leading-relaxed">
              I confirm that this video is unedited and meets all the verification standards. I understand that any false or misleading submissions will result in disqualification.
            </label>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="font-body text-[11px] font-medium text-[#0009] tracking-[2.2px] block mb-1.5">
              ADDITIONAL NOTES
            </label>
            <textarea
              name="additionalNotes"
              placeholder="Anything else you'd like us to know?"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-[#0003] bg-[#0000001a] text-gray-900 placeholder:text-gray-400 font-body text-sm px-5 py-3.5 focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]/20 transition-all rounded-lg resize-none"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group w-full relative bg-black text-white font-body text-sm tracking-[0.15em] uppercase px-8 py-4 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed rounded-lg"
            >
              <span className="absolute inset-0 bg-[#B8860B] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {getButtonText()}
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BenchClubForm;