// components/EditApplicationModal.tsx
import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Application = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    instagram_handle: string | null;
    lift_type: string;
    weight_tier: number;
    video_url: string | null;
    notes: string | null;
    status: string;
    created_at: string;
};

const TIERS = [225, 315, 405];
const LIFTS = ["Bench Press", "Deadlift"];

export function EditApplicationModal({
    application,
    apiUrl,
    onClose,
    onSaved,
}: {
    application: Application;
    apiUrl: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name: application.name || "",
        email: application.email || "",
        phone: application.phone || "",
        instagram_handle: application.instagram_handle || "",
        lift_type: application.lift_type || "Bench Press",
        weight_tier: application.weight_tier || 135,
        notes: application.notes || "",
    });
    const [saving, setSaving] = useState(false);

    const hasChanges =
        form.name !== (application.name || "") ||
        form.email !== (application.email || "") ||
        form.phone !== (application.phone || "") ||
        form.instagram_handle !== (application.instagram_handle || "") ||
        form.lift_type !== application.lift_type ||
        form.weight_tier !== application.weight_tier ||
        form.notes !== (application.notes || "");

    const save = async () => {
        if (!form.name.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!form.email.trim()) {
            toast.error("Email is required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${apiUrl}/api/bench-club/applications/${application.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    phone_number: form.phone.trim() || null,
                    instagram_handle: form.instagram_handle.trim() || null,
                    lift_type: form.lift_type,
                    weight_tier: form.weight_tier,
                    additional_notes: form.notes.trim() || null,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || `Update failed (${res.status})`);
            }

            toast.success("Application updated");
            onSaved();
            onClose();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const statusLocked = application.status !== "pending";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-[hsl(222,47%,11%)]">
                            Edit Application
                        </h2>
                        <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">
                            Application #{application.id}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Warning if not pending */}
                {statusLocked && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            This application is <strong>{application.status}</strong>. Only{" "}
                            <strong>pending</strong> applications can be edited.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            disabled={statusLocked}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            disabled={statusLocked}
                        />
                    </div>

                    {/* Phone + Instagram */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                                Phone
                            </label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                disabled={statusLocked}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                                Instagram
                            </label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                value={form.instagram_handle}
                                onChange={(e) =>
                                    setForm({ ...form, instagram_handle: e.target.value })
                                }
                                disabled={statusLocked}
                            />
                        </div>
                    </div>

                    {/* Tier + Club */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                                Tier (lb)
                            </label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                value={form.weight_tier}
                                onChange={(e) =>
                                    setForm({ ...form, weight_tier: Number(e.target.value) })
                                }
                                disabled={statusLocked}
                            >
                                {TIERS.map((t) => (
                                    <option key={t} value={t}>
                                        {t} lb
                                    </option>
                                ))}
                                {!TIERS.includes(form.weight_tier) && (
                                    <option value={form.weight_tier}>
                                        {form.weight_tier} lb (current)
                                    </option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                                Club
                            </label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                value={form.lift_type}
                                onChange={(e) =>
                                    setForm({ ...form, lift_type: e.target.value })
                                }
                                disabled={statusLocked}
                            >
                                {LIFTS.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-medium text-[hsl(215,16%,47%)]">
                            Notes
                        </label>
                        <textarea
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            disabled={statusLocked}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={saving || statusLocked || !hasChanges}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}