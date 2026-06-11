// components/vendor/OrgEditModal.tsx
import { useState, memo } from "react";
import type { VendorOrg } from "../../slices/organizationSlice";
import {
  Building2, Mail, MapPin, Clock,
  UtensilsCrossed, Users, X, Loader2, Save,
} from "lucide-react";

export interface EditOrgForm {
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  mealTime:          string;
  cutoffTime:        string;
  capacity:          string;
  allowDishRequests: boolean;
}

interface Props {
  org:     VendorOrg;
  saving:  boolean;
  onClose: () => void;
  onSave:  (form: EditOrgForm) => void;
}

const labelCls = "text-[11px] font-bold text-gray-400 uppercase tracking-widest";

const OrgEditModal = memo(({ org, saving, onClose, onSave }: Props) => {
  const [form, setForm] = useState<EditOrgForm>({
    companyName:       org.companyName       ?? "",
    contactEmail:      org.contactEmail      ?? "",
    officeAddress:     org.officeAddress     ?? "",
    mealTime:          org.mealTime          ?? "",
    cutoffTime:        org.cutoffTime        ?? "",
    capacity:          String(org.capacity   ?? ""),
    allowDishRequests: org.allowDishRequests ?? true,
  });
  const [error, setError] = useState("");

  const set = (k: keyof EditOrgForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const handleSubmit = () => {
    if (!form.companyName.trim())  return setError("Company name is required.");
    if (!form.contactEmail.trim()) return setError("Contact email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
      return setError("Enter a valid email.");
    if (!form.officeAddress.trim()) return setError("Office address is required.");
    if (!form.mealTime)             return setError("Meal time is required.");
    if (!form.cutoffTime)           return setError("Cutoff time is required.");
    if (form.cutoffTime >= form.mealTime) return setError("Cutoff must be before meal time.");
    if (!form.capacity || Number(form.capacity) <= 0)
      return setError("Capacity must be greater than 0.");
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[18px] font-bold text-gray-900">Edit Organization</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Org info header */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{org.companyName}</p>
              {org.admin && (
                <p className="text-xs text-gray-400">Admin: {org.admin.name}</p>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Company Name *</label>
            <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
              <Building2 size={15} className="text-gray-400 shrink-0" />
              <input type="text" value={form.companyName} onChange={set("companyName")}
                placeholder="Acme Corp" className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Contact Email *</label>
            <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
              <Mail size={15} className="text-gray-400 shrink-0" />
              <input type="email" value={form.contactEmail} onChange={set("contactEmail")}
                placeholder="contact@acme.com" className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Office Address *</label>
            <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <input type="text" value={form.officeAddress} onChange={set("officeAddress")}
                placeholder="123 Main St, City" className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Meal Time *</label>
              <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
                <UtensilsCrossed size={15} className="text-gray-400 shrink-0" />
                <input type="time" value={form.mealTime} onChange={set("mealTime")}
                  className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Cutoff *</label>
              <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
                <Clock size={15} className="text-gray-400 shrink-0" />
                <input type="time" value={form.cutoffTime} onChange={set("cutoffTime")}
                  className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Daily Capacity *</label>
            <div className="flex items-center border rounded-xl px-3 border-gray-200 focus-within:border-[#FF7A00] bg-white h-11">
              <Users size={15} className="text-gray-400 shrink-0" />
              <input type="number" value={form.capacity} onChange={set("capacity")} min={1}
                placeholder="200" className="ml-2.5 w-full outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400" />
            </div>
          </div>

          {/* Allow dish requests toggle */}
          <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Allow dish requests:{" "}
              <span className={`font-bold ${form.allowDishRequests ? "text-emerald-600" : "text-gray-400"}`}>
                {form.allowDishRequests ? "Yes" : "No"}
              </span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox" checked={form.allowDishRequests}
                onChange={e => { setForm(f => ({ ...f, allowDishRequests: e.target.checked })); }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </label>
          </div>

          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose} disabled={saving}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:brightness-90 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrgEditModal;