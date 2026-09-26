import { useState } from "react";
import { X, Save, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: number;
  name: string;
  email: string;
  lift_type: string;
  weight_tier: number;
  member_number: number;
};

const TIERS = [225, 315, 405];
const LIFTS = ["Bench Press", "Deadlift", "Both"];

export function EditMemberModal({
  member,
  apiUrl,
  onClose,
  onSaved,
}: {
  member: Member;
  apiUrl: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...member });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasChanges =
    form.name !== member.name ||
    form.email !== member.email ||
    form.lift_type !== member.lift_type ||
    form.weight_tier !== member.weight_tier ||
    form.member_number !== member.member_number;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/bench-club/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.name,
          email: form.email,
          lift_type: form.lift_type,
          weight_tier: form.weight_tier,
          member_number: form.member_number,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Update failed (${res.status})`);
      }

      toast.success("Member updated");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/api/bench-club/members/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Delete failed (${res.status})`);
      }
      toast.success(data.message || "Member removed");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-[hsl(222,47%,11%)]">
              Edit Member
            </h2>
            <p className="text-xs text-[hsl(215,16%,47%)]">
              Member #{String(member.member_number).padStart(4, "0")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
              Full Name
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                Tier (lb)
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.weight_tier}
                onChange={(e) =>
                  setForm({ ...form, weight_tier: Number(e.target.value) })
                }
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t} lb
                  </option>
                ))}
                {!TIERS.includes(form.weight_tier) && (
                  <option value={form.weight_tier}>{form.weight_tier} lb (current)</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                Member Number
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.member_number}
                onChange={(e) =>
                  setForm({ ...form, member_number: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
              Club Membership
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.lift_type}
              onChange={(e) => setForm({ ...form, lift_type: e.target.value })}
            >
              {LIFTS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
              {form.lift_type === "Both"
                ? "Member will appear in both Bench and Deadlift lists."
                : `Member will appear only in ${form.lift_type} list.`}
            </p>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Delete this member permanently?
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {member.name} (#{String(member.member_number).padStart(4, "0")}) will be removed. This cannot be undone.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={remove}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving || deleting || showDeleteConfirm}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || deleting || !hasChanges}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}