// components/GenerateInvitesPanel.tsx
import { useState, useEffect } from "react";
import { Mail, Send, CheckCircle2, XCircle, RefreshCw, Users, Copy, Eye, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://slategrey-cattle-753687.hostingersite.com";

type Invite = {
  email: string;
  name: string;
  token: string;
  link: string;
  emailSent?: boolean;
  error?: string;
};

export function GenerateInvitesPanel() {
  const [loading, setLoading] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);

  // ✅ STEP 1: Generate Invites (tokens only)
  const handleGenerateInvites = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/generate-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server error (${response.status}): Route not found.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate invites.");
      }

      setInvites(data.data || []);
      setGenerated(true);
      setSelectedEmails(data.data?.map((i: Invite) => i.email) || []);

      toast.success(`${data.data?.length || 0} invite tokens generated!`);
    } catch (error) {
      console.error("Generate invites error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate invites.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSend = async () => {
    if (bulkSending) return;

    // ✅ Deduplicate emails before sending
    const uniqueEmails = [...new Set(selectedEmails)];

    if (uniqueEmails.length === 0) {
      toast.error("No emails to send. Generate invites first.");
      return;
    }

    console.log(`📤 Sending to ${uniqueEmails.length} unique emails`);

    setBulkSending(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/send-bulk-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: uniqueEmails }), // ✅ Send unique only
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails.");
      }

      // ✅ Update invites with sent status (deduplicate display)
      const updatedInvites = invites.map(invite => {
        const result = data.data.results.find((r: any) => r.email === invite.email);
        if (result) {
          return { ...invite, emailSent: result.sent, error: result.error };
        }
        return invite;
      });

      setInvites(updatedInvites);
      setSummary({
        total: data.data.total,
        sent: data.data.sent,
        failed: data.data.failed,
      });

      toast.success(`${data.data.sent} emails sent successfully!`);
      if (data.data.failed > 0) {
        toast.warning(`${data.data.failed} emails failed to send.`);
      }
    } catch (error) {
      console.error("Bulk send error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send emails.");
    } finally {
      setBulkSending(false);
    }
  };

  // ✅ STEP 3: Send Single Invite
  const handleSendSingle = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite.");
      }

      // Update invite status
      setInvites(prev => prev.map(inv =>
        inv.email === email ? { ...inv, emailSent: true, error: undefined } : inv
      ));

      toast.success(`Invite sent to ${email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite.");
    }
  };

  // ✅ Toggle email selection
  const toggleEmailSelection = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  // ✅ Select all / Deselect all
  const toggleSelectAll = () => {
    if (selectedEmails.length === invites.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(invites.map(i => i.email));
    }
  };

  // ✅ Copy functions
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  const copyAllEmails = () => {
    const emails = invites.map((i) => i.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`${invites.length} emails copied!`);
  };

  const copyAllLinks = () => {
    const links = invites.map((i) => `${i.email}: ${i.link}`).join("\n");
    navigator.clipboard.writeText(links);
    toast.success(`${invites.length} links copied!`);
  };

  // ✅ Get pending count (not yet sent)
  const pendingCount = invites.filter(i => !i.emailSent).length;
  const sentCount = invites.filter(i => i.emailSent).length;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] flex items-center gap-2">
              <Users className="w-6 h-6" /> Generate Invites
            </h1>
            <p className="text-sm text-[hsl(215,16%,47%)] mt-1">
              Send password setup links to old users without login accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              3-Step Process
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Generate:</strong> Creates unique tokens for all users without accounts</li>
              <li><strong>Review:</strong> Select which users to send emails to</li>
              <li><strong>Send:</strong> Bulk send emails with "Set Password" links</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Step 1: Generate Button */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleGenerateInvites}
          disabled={loading}
          className="flex items-center gap-2 bg-[hsl(211,100%,50%)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[hsl(211,100%,45%)] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Step 1: Generate Invites
            </>
          )}
        </button>

        {/* Step 2: Bulk Send Button (only shows after generate) */}
        {generated && invites.length > 0 && (
          <button
            onClick={handleBulkSend}
            disabled={bulkSending || selectedEmails.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {bulkSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Step 2: Send {selectedEmails.length} Emails
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {generated && invites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-5">
            <p className="text-xs text-[hsl(215,16%,47%)] uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-[hsl(222,47%,11%)]">{invites.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-5">
            <p className="text-xs text-green-700 uppercase tracking-wider mb-1">Sent</p>
            <p className="text-3xl font-bold text-green-700">{sentCount}</p>
          </div>
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
            <p className="text-xs text-amber-700 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
          </div>
        </div>
      )}

      {/* Generated Invites List */}
      {generated && (
        <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] overflow-hidden">
          {/* Header with Select All */}
          <div className="px-5 py-4 border-b border-[hsl(214,32%,91%)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedEmails.length === invites.length && invites.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <h3 className="font-semibold text-[hsl(222,47%,11%)]">
                Generated Invites ({invites.length})
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAllEmails}
                className="text-xs text-[hsl(211,100%,50%)] hover:underline"
              >
                Copy Emails
              </button>
              <button
                onClick={copyAllLinks}
                className="text-xs text-[hsl(211,100%,50%)] hover:underline"
              >
                Copy Links
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-[hsl(211,100%,50%)] hover:underline"
              >
                {showPreview ? "Hide" : "Show"} Links
              </button>
            </div>
          </div>

          {/* Invites List */}
          {invites.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-10 h-10 mx-auto text-[hsl(215,16%,47%)] mb-3" />
              <p className="text-sm text-[hsl(215,16%,47%)]">
                No pending users found. All users already have accounts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(214,32%,91%)]">
              {invites.map((invite, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-[hsl(210,40%,96%)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(invite.email)}
                        onChange={() => toggleEmailSelection(invite.email)}
                        className="w-4 h-4 mt-1 rounded border-gray-300"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-[hsl(222,47%,11%)]">
                            {invite.name}
                          </p>
                          {invite.emailSent ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : invite.error ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[hsl(215,16%,47%)] mb-2">
                          {invite.email}
                        </p>
                        {showPreview && (
                          <div className="mt-2 p-2 bg-[hsl(210,40%,96%)] rounded border border-[hsl(214,32%,91%)]">
                            <p className="text-xs text-[hsl(215,16%,47%)] break-all font-mono">
                              {invite.link}
                            </p>
                          </div>
                        )}
                        {invite.error && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {invite.error}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyLink(invite.link)}
                        className="p-2 rounded-lg hover:bg-[hsl(210,40%,96%)] transition-colors text-[hsl(215,16%,47%)]"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {!invite.emailSent && (
                        <button
                          onClick={() => handleSendSingle(invite.email)}
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          title="Send email"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!generated && (
        <div className="bg-white rounded-lg border border-[hsl(214,32%,91%)] p-12 text-center">
          <Send className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-3" />
          <p className="text-sm text-[hsl(215,16%,47%)] mb-1">
            Ready to generate invites
          </p>
          <p className="text-xs text-[hsl(215,16%,47%)]">
            Click <strong>Step 1: Generate Invites</strong> to create tokens, then <strong>Step 2</strong> to send emails.
          </p>
        </div>
      )}
    </div>
  );
}