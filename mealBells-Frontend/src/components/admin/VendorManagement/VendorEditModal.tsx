import { useState, useRef, memo } from "react";
import toast from "react-hot-toast";
import VendorAvatar from "./VendorAvatar";
import type { EditVendorForm, Vendor } from "../../../types/admin";
import DropDown from "../../shared/DropDown";

const FOOD_TYPES = ["Veg", "Non-Veg", "Both"];

interface VendorEditModalProps {
  vendor: Vendor;
  onClose: () => void;
  onSave: (form: EditVendorForm, file?: File) => Promise<void>;
}

const VendorEditModal = memo(({ vendor, onClose, onSave }: VendorEditModalProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EditVendorForm>({
    name:           vendor.name           ?? "",
    email:          vendor.email          ?? "",
    phone:          vendor.phone          ?? "",
    capacity:       String(vendor.capacity ?? ""),
    deliveryTiming: vendor.deliveryTiming ?? "",
    foodType:       vendor.foodType       ?? "Both",
  });
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imgError,    setImgError]    = useState(false);
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);

  const setField = (k: keyof EditVendorForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setError("");
    };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Only image files allowed");
    if (file.size > 2 * 1024 * 1024)     return toast.error("Logo must be under 2MB");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setImgError(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim())  return setError("Vendor name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.foodType)     return setError("Food type is required.");
    try {
      setSaving(true);
      await onSave(form, logoFile ?? undefined);
    } catch (err: any) {
      setError(err.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const displayLogo = logoPreview ?? (!imgError && vendor.logo ? vendor.logo : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[18px] font-bold text-gray-900">Edit Vendor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Logo + info row */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="relative shrink-0 group">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={vendor.name}
                  onError={() => { if (!logoPreview) setImgError(true); }}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow"
                />
              ) : (
                <VendorAvatar name={vendor.name} logo="" size="md" />
              )}
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{vendor.name}</p>
              <p className="text-xs text-gray-400 truncate">{vendor.email}</p>
              <p className="text-xs text-orange-500 font-semibold mt-0.5">{vendor.vendorId}</p>
              {logoFile && <p className="text-[11px] text-emerald-500 font-medium mt-0.5">✓ New logo selected</p>}
            </div>
          </div>

          {/* Fields */}
          {(
            [
              { label: "Vendor Name", key: "name",           type: "text",   placeholder: "e.g. Gourmet Kitchens" },
              { label: "Email",       key: "email",          type: "email",  placeholder: "vendor@example.com" },
              { label: "Phone",       key: "phone",          type: "text",   placeholder: "+1 (555) 000-0000" },
              { label: "Daily Capacity", key: "capacity",    type: "number", placeholder: "500" },
              { label: "Delivery Timing", key: "deliveryTiming", type: "text", placeholder: "11:30 AM - 1:30 PM" },
            ] as const
          ).map(({ label, key, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={setField(key)}
                placeholder={placeholder}
                className={`border rounded-xl px-3 py-[10px] text-sm focus:outline-none transition-colors
                  ${(key === "name" || key === "email") && !form[key].trim()
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 focus:border-[#FF7A00]"
                  }`}
              />
            </div>
          ))}

          {/* Food Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Food Type</label>
            <DropDown
              wfull
              value={form.foodType}
              options={FOOD_TYPES}
              placeholder="Select food type…"
              hasError={!form.foodType}
              onChange={(v) => { setForm((f) => ({ ...f, foodType: v })); setError(""); }}
            />
          </div>

          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:brightness-90 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
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

export default VendorEditModal;