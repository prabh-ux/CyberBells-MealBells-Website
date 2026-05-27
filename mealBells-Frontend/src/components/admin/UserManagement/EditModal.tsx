import { useState, memo } from "react";
import type { EditForm, User } from "../../../types/admin";
import { DEPARTMENTS, fields } from "../../../data/UserManagement";
import DropDown from "../../shared/DropDown";
import StatusBadge from "./StatusBadge";

const InitialsAvatar = ({ name, size = "md" }: { name: string; size?: "md" | "lg" }) => {
  const initials = name.trim().split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const colors = ["bg-orange-400","bg-sky-400","bg-emerald-400","bg-violet-400","bg-rose-400","bg-amber-400"];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  const sizeClass = size === "lg" ? "w-14 h-14 text-lg" : "w-9 h-9 text-xs";
  return (
    <div className={`${sizeClass} ${colors[colorIndex]} rounded-full shrink-0 ring-2 ring-white shadow flex items-center justify-center text-white font-bold`}>
      {initials || "?"}
    </div>
  );
};

const Missing = () => (
  <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
    <span>!</span> Required
  </span>
);

const EditModal = memo(({ user, onClose, onSave }: {
  user: User;
  onClose: () => void;
  onSave: (f: EditForm) => Promise<void>;   // 👈 now async
}) => {
  const [form, setForm] = useState<EditForm>({
    name:       user.name       ?? "",
    email:      user.email      ?? "",
    phone:      user.phone      ?? "",
    department: user.department ?? "",
  });
  const [imgError,  setImgError]  = useState(false);
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);  // 👈 loading state

  const set = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError("");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.department)
      return setError("All fields are required.");
    if (!/\S+@\S+\.\S+/.test(form.email))
      return setError("Enter a valid email address.");

    try {
      setSaving(true);
      await onSave(form);          // throws on API error
    } catch (err: any) {
      setError(err.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const showInitials  = !user.avatar || imgError;
  const hasAnyMissing = !form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.department;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)] shrink-0">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">Edit User</h2>
          <button onClick={onClose} className="text-[var(--text-label)] hover:text-[var(--text-primary)] text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          {/* API / validation error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Warning banner */}
          {hasAnyMissing && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-sm mt-0.5">⚠</span>
              <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                Fill in the highlighted fields before saving.
              </p>
            </div>
          )}

          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 bg-[#F9F9F9] rounded-xl border border-[var(--border)]">
            {showInitials
              ? <InitialsAvatar name={user.name || "?"} size="lg" />
              : <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow" onError={() => setImgError(true)} />
            }
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">{user.name || "—"}</p>
              <p className="text-[12px] text-[var(--text-label)] [font-family:var(--font-inter)]">{user.email || "—"}</p>
              <StatusBadge s={user.status} />
            </div>
          </div>

          {/* Text fields */}
          {fields.map(({ key, label, placeholder, type = "text" }) => {
            const empty = !form[key].trim();
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-label)] [font-family:var(--font-inter)] flex items-center gap-2">
                  {label} {empty && <Missing />}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className={`border rounded-xl px-3 py-[10px] text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none transition-colors placeholder:text-[#9CA3AF]
                    ${empty ? "border-red-300 bg-red-50 focus:border-red-400" : "border-[var(--border)] focus:border-[#FF7A00]"}`}
                />
                {empty && <p className="text-[11px] text-red-400 font-medium pl-1">{label} is required.</p>}
              </div>
            );
          })}

          {/* Department */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-label)] [font-family:var(--font-inter)] flex items-center gap-2">
              Department {!form.department && <Missing />}
            </label>
            <DropDown
              wfull
              value={form.department}
              options={DEPARTMENTS}
              placeholder="Select department…"
              hasError={!form.department}
              onChange={(v) => { setForm((f) => ({ ...f, department: v })); setError(""); }}
            />
            {!form.department && <p className="text-[11px] text-red-400 font-medium pl-1">Department is required.</p>}
          </div>

          <div className="h-32" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--divider)] shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 rounded-xl border border-[var(--border)] text-[14px] font-semibold text-[var(--text-label)] hover:text-[var(--text-primary)] disabled:opacity-40 [font-family:var(--font-inter)]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:brightness-90 text-white text-[14px] font-semibold disabled:opacity-60 [font-family:var(--font-inter)] flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default EditModal;