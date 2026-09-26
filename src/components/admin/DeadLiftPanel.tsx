// components/BenchClubPanel.tsx
import { useEffect, useState } from "react";
import { Check, X, Dumbbell, Mail, Phone, Instagram, ExternalLink, Trophy, RefreshCw, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { EditMemberModal } from "./EditMemberModal";
import { Edit } from "lucide-react";
import { EditApplicationModal } from "./EditApplicationModal";

type App = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  instagram_handle: string | null;
  lift_type: string;  // ✅ Add lift_type
  weight_tier: number;
  video_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  lift_type: string;  // ✅ Add lift_type
  weight_tier: number;
  member_number: number;
  approved_at: string;
};

const TABS = [
  { id: "applications", label: "Applications" },
  { id: "members", label: "Members" },
] as const;

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

export function DeadLiftPanel() {
  const [tab, setTab] = useState<"applications" | "members">("applications");
  const [apps, setApps] = useState<App[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  // ✅ Video Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<string>("");

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);

    try {
      // ✅ Fetch applications - ONLY Dead lift
      const appsRes = await fetch(`${API_URL}/api/bench-club/applications?status=all&lift_type=Deadlift`);

      if (!appsRes.ok) {
        const errorText = await appsRes.text();
        console.error("Apps API error:", errorText);
        throw new Error(`HTTP ${appsRes.status}: Failed to fetch applications`);
      }

      const appsData = await appsRes.json();
      if (appsData.success) {
        // ✅ Filter only Bench Press on frontend too (double safety)
        const benchPressApps = (appsData.data || []).filter(
          (app: App) => app.lift_type?.toLowerCase() === 'deadlift'
        );
        setApps(benchPressApps);
      } else {
        throw new Error(appsData.error || "Failed to fetch applications");
      }

      // ✅ Fetch members - ONLY BENCH PRESS
      const membersRes = await fetch(`${API_URL}/api/bench-club/members?lift_type=Deadlift`);

      if (!membersRes.ok) {
        const errorText = await membersRes.text();
        console.error("Members API error:", errorText);
        throw new Error(`HTTP ${membersRes.status}: Failed to fetch members`);
      }

      const membersData = await membersRes.json();
      if (membersData.success) {
        // ✅ Filter only Bench Press on frontend too (double safety)
        const benchPressMembers = (membersData.data || []).filter((member: Member) => {
          const lt = member.lift_type?.toLowerCase();
          return lt === 'deadlift' || lt === 'both';
        });
        setMembers(benchPressMembers);
      } else {
        throw new Error(membersData.error || "Failed to fetch members");
      }
    } catch (error) {
      console.error("Load error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load data. Please check if backend server is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [filter]);

  // ✅ Send Email Function
  const sendStatusEmail = async (email: string, name: string, status: string, tier: number, memberNumber?: number) => {
    try {
      const response = await fetch(`${API_URL}/api/email/bench-club-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.split(" ")[0] || name,
          tier,
          status,
          memberNumber: memberNumber || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Email send failed:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  };

  const approve = async (a: App) => {
    setBusy(a.id);
    try {
      const response = await fetch(`${API_URL}/api/bench-club/applications/${a.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Approval failed.");
      }

      const data = await response.json();
      const memberNumber = data.data?.member_number || '';

      // ✅ Handle different response types
      if (data.isDuplicate) {
        toast.success(`${a.name} already has ${a.weight_tier} lb tier. Application approved!`);
      } else if (data.isUpgrade) {
        toast.success(`🎉 ${a.name} upgraded to ${a.weight_tier} lb tier! Member #${String(memberNumber).padStart(4, '0')}`);
      } else {
        toast.success(`${a.name} added to ${a.weight_tier} Club! Member #${String(memberNumber).padStart(4, '0')}`);
      }

      // ✅ Send approval email
      await sendStatusEmail(a.email, a.name, 'approved', a.weight_tier, memberNumber);

      await loadData(false);
    } catch (e: any) {
      toast.error(e.message || "Approval failed");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (a: App) => {
    setBusy(a.id);
    try {
      const response = await fetch(`${API_URL}/api/bench-club/applications/${a.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Rejection failed.");
      }

      toast.success("Application rejected.");

      // ✅ Send rejection email
      await sendStatusEmail(a.email, a.name, 'rejected', a.weight_tier);

      await loadData(false);
    } catch (e: any) {
      toast.error(e.message || "Rejection failed");
    } finally {
      setBusy(null);
    }
  };

  // ✅ Open Video Modal
  const openVideoModal = (videoUrl: string, applicantName: string) => {
    setSelectedVideo(videoUrl);
    setSelectedApplicant(applicantName);
    setShowVideoModal(true);
    document.body.style.overflow = 'hidden';
  };

  // ✅ Close Video Modal
  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
    setSelectedApplicant("");
    document.body.style.overflow = 'auto';
  };

  const filtered = apps.filter((r) => (filter === "all" ? true : r.status === filter));

  const allCount = apps.length;
  const pendingCount = apps.filter((r) => r.status === "pending").length;
  const approvedCount = apps.filter((r) => r.status === "approved").length;
  const rejectedCount = apps.filter((r) => r.status === "rejected").length;

  const textStyle = {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={textStyle}>
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] flex items-center gap-2">
              <Dumbbell className="w-6 h-6" /> Dead Lift
            </h1>
            <p className="text-sm text-[hsl(215,16%,47%)] mt-1">
              Review Deadlift applications and manage verified members.
            </p>
          </div>
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-[hsl(214,32%,91%)] rounded-lg hover:bg-[hsl(210,40%,96%)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-[hsl(214,32%,91%)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2.5 -mb-px border-b-2 transition-colors ${tab === t.id
              ? "border-[hsl(211,100%,50%)] text-[hsl(211,100%,50%)] font-medium"
              : "border-transparent text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)]"
              }`}
          >
            {t.label} {t.id === "applications" ? `(${pendingCount})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {tab === "applications" && (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilter("pending")}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${filter === "pending"
                ? "bg-[hsl(211,100%,50%)] text-white border-[hsl(211,100%,50%)]"
                : "bg-white text-[hsl(222,47%,11%)] border-[hsl(214,32%,91%)] hover:bg-[hsl(210,40%,96%)]"
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${filter === "approved"
                ? "bg-[hsl(211,100%,50%)] text-white border-[hsl(211,100%,50%)]"
                : "bg-white text-[hsl(222,47%,11%)] border-[hsl(214,32%,91%)] hover:bg-[hsl(210,40%,96%)]"
                }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${filter === "rejected"
                ? "bg-[hsl(211,100%,50%)] text-white border-[hsl(211,100%,50%)]"
                : "bg-white text-[hsl(222,47%,11%)] border-[hsl(214,32%,91%)] hover:bg-[hsl(210,40%,96%)]"
                }`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${filter === "all"
                ? "bg-[hsl(211,100%,50%)] text-white border-[hsl(211,100%,50%)]"
                : "bg-white text-[hsl(222,47%,11%)] border-[hsl(214,32%,91%)] hover:bg-[hsl(210,40%,96%)]"
                }`}
            >
              All ({allCount})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(211,100%,50%)]"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-12 text-center">
              <Dumbbell className="w-10 h-10 mx-auto text-[hsl(215,16%,47%)] mb-3" />
              <p className="text-sm text-[hsl(215,16%,47%)]">
                No {filter !== 'all' ? filter : ''} Deadlift applications found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-5 hover:shadow-sm transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="text-base font-semibold text-[hsl(222,47%,11%)]">{a.name}</p>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                          {a.weight_tier} lb
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                          {a.lift_type}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full ${a.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : a.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[hsl(215,16%,47%)]">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {a.email}</span>
                        {a.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {a.phone}</span>}
                        {a.instagram_handle && (
                          <span className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-pink-500" /> @{a.instagram_handle}</span>
                        )}
                      </div>

                      {a.video_url && (
                        <button
                          onClick={() => openVideoModal(a.video_url!, a.name)}
                          className="inline-flex items-center gap-1.5 mt-3 text-sm text-[hsl(211,100%,50%)] hover:underline focus:outline-none"
                        >
                          <Play className="w-4 h-4" /> Watch lift video
                        </button>
                      )}

                      {a.notes && <p className="text-sm text-[hsl(222,47%,11%)] mt-2 whitespace-pre-wrap">{a.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-[hsl(215,16%,47%)]">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                      {a.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(a)}
                            disabled={busy === a.id}
                            className="bg-[hsl(211,100%,50%)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[hsl(211,100%,45%)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                          >
                            {busy === a.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Verify
                          </button>
                          <button
                            onClick={() => reject(a)}
                            disabled={busy === a.id}
                            className="bg-white text-[hsl(222,47%,11%)] border border-[hsl(214,32%,91%)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[hsl(210,40%,96%)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => setEditingApp(a)}
                            disabled={busy === a.id}
                            className="bg-white text-[hsl(222,47%,11%)] border border-[hsl(214,32%,91%)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[hsl(210,40%,96%)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                            title="Edit application"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ✅ Edit Application Modal */}
      {editingApp && (
        <EditApplicationModal
          application={editingApp}
          apiUrl={API_URL}
          onClose={() => setEditingApp(null)}
          onSaved={() => loadData(false)}
        />
      )}

      {tab === "members" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(211,100%,50%)]"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-12 text-center">
              <Trophy className="w-10 h-10 mx-auto text-[hsl(215,16%,47%)] mb-3" />
              <p className="text-sm text-[hsl(215,16%,47%)]">No verified Dead Lift members yet.</p>
            </div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
                <div className="flex gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[hsl(215,16%,47%)]">Member</p>
                    <p className="text-lg font-bold text-[hsl(222,47%,11%)]">#{String(m.member_number).padStart(4, "0")}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-base font-semibold text-[hsl(222,47%,11%)]">{m.name}</p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                        {m.weight_tier} Club
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                        {m.lift_type === "Both" ? "Deadlift" : m.lift_type}
                      </span>
                    </div>
                    <p className="text-sm text-[hsl(215,16%,47%)] mt-1">{m.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingMember(m)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Edit member"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          apiUrl={API_URL}
          onClose={() => setEditingMember(null)}
          onSaved={() => loadData(false)}
        />
      )}

      {/* ✅ Video Modal */}
      {showVideoModal && selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={closeVideoModal}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(214,32%,91%)]">
              <div>
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)]">
                  {selectedApplicant}'s Lift Video
                </h3>
                <p className="text-sm text-[hsl(215,16%,47%)]">
                  Verification video
                </p>
              </div>
              <button
                onClick={closeVideoModal}
                className="p-2 rounded-lg hover:bg-[hsl(210,40%,96%)] transition-colors"
              >
                <XCircle className="w-6 h-6 text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)]" />
              </button>
            </div>

            {/* Video Player */}
            <div className="p-4 bg-[hsl(0,0%,98%)]">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedVideo}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-[hsl(214,32%,91%)] bg-[hsl(0,0%,98%)]">
              <button
                onClick={closeVideoModal}
                className="px-4 py-2 text-sm font-medium text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
