import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { addVendor, resetVendorState, clearNewVendorCredentials } from "../../slices/adminSlice";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, Save, Clock, List,
  ShieldCheck, TrendingUp, UploadCloud,
  CheckCircle, Loader2, Copy, Eye, EyeOff, ArrowRight,
} from "lucide-react";
import TimeDropdown, { EMPTY_TIME, fmtTime, timeToMins, type TimeValue } from "../../components/shared/Timedropdown";

type ErrorFields = Partial<Record<
  "name" | "email" | "phone" | "capacity" | "deliveryStart" | "deliveryEnd", string
>>;

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({
  label, required, error, icon: Icon, children,
}: {
  label: string; required?: boolean; error?: string; icon: React.ElementType; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <div className={`flex items-center border rounded-xl px-3 sm:px-4 h-11 sm:h-12 transition-all ${
      error
        ? "border-red-400 bg-red-50"
        : "border-gray-200 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500"
    }`}>
      <Icon size={17} className={error ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
      {children}
    </div>
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

const inputCls = "w-full ml-2.5 sm:ml-3 outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400";

// ── Credentials Modal ─────────────────────────────────────────────────────────
function CredentialsModal({ name, email, password, onDone }: {
  name: string; email: string; password: string; onDone: () => void;
}) {
  const [showPass,    setShowPass]    = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass,  setCopiedPass]  = useState(false);

  const copy = (text: string, type: "email" | "pass") => {
    navigator.clipboard.writeText(text);
    if (type === "email") { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }
    else                  { setCopiedPass(true);  setTimeout(() => setCopiedPass(false),  2000); }
  };

  return (
    // Bottom sheet on mobile, centered on sm+
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-8">

        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vendor Created!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Share these login credentials with <span className="font-semibold text-gray-700">{name}</span>.
            <br /><span className="text-red-500 font-semibold">This password won't be shown again.</span>
          </p>
        </div>

        <div className="space-y-3 mb-5 sm:mb-6">
          {/* Email */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{email}</p>
            </div>
            <button onClick={() => copy(email, "email")}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 transition-colors">
              <Copy size={13} />{copiedEmail ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Password */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Temp Password</p>
              <p className="text-sm font-semibold text-gray-800 font-mono tracking-wider">
                {showPass ? password : "•".repeat(password.length)}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
              <button onClick={() => setShowPass(p => !p)}
                className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-400 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => copy(password, "pass")}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-orange-200 hover:border-orange-400 hover:text-orange-500 transition-colors">
                <Copy size={13} />{copiedPass ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <button onClick={() => { copy(`Email: ${email}\nPassword: ${password}`, "pass"); toast.success("Credentials copied!"); }}
          className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
          <Copy size={15} /> Copy Both
        </button>

        <button onClick={onDone}
          className="w-full bg-[#FF7A00] hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20">
          Go to Vendors <ArrowRight size={16} />
        </button>

        <p className="text-center text-[11px] text-gray-400 mt-3">
          The vendor can change their password after first login.
        </p>
      </div>
    </div>
  );
}

// ── AddVendor ─────────────────────────────────────────────────────────────────
const AddVendor = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { adding, error, newVendorCredentials } = useSelector((s: RootState) => s.admin);

  const fileRef                       = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErrorFields>({});
  const [timeFrom, setTimeFrom]       = useState<TimeValue>(EMPTY_TIME);
  const [timeTo,   setTimeTo]         = useState<TimeValue>(EMPTY_TIME);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", capacity: "",
    status: true, foodType: "Both",
    logoPreview: null as string | null,
  });

  const set      = useCallback((k: string, v: unknown) => setForm(f => ({ ...f, [k]: v })), []);
  const clearErr = (f: keyof ErrorFields) => setFieldErrors(p => { const n = { ...p }; delete n[f]; return n; });

  const isReady = useMemo(() =>
    !!(form.name.trim() && form.email.trim() && form.phone.trim() &&
      form.capacity.trim() && fmtTime(timeFrom) && fmtTime(timeTo)),
    [form.name, form.email, form.phone, form.capacity, timeFrom, timeTo]
  );

  useEffect(() => () => { dispatch(resetVendorState()); }, [dispatch]);

  const prevAdding = useRef(false);
  useEffect(() => {
    if (prevAdding.current && !adding && error) toast.error(error);
    prevAdding.current = adding;
  }, [adding, error]);

  const handleModalDone = () => { dispatch(clearNewVendorCredentials()); navigate("/admin/vendors"); };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error("Max 2MB");      return; }
    setLogoFile(file);
    set("logoPreview", URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (adding) return;
    const errs: ErrorFields = {};
    if (!form.name.trim())     errs.name = "Vendor name is required";
    if (!form.email.trim())    errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email";
    if (!form.phone.trim())    errs.phone = "Phone is required";
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim()))     errs.phone = "Enter a valid phone number";
    if (!form.capacity.trim()) errs.capacity = "Capacity is required";
    else if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) errs.capacity = "Must be a positive number";
    if (!fmtTime(timeFrom))    errs.deliveryStart = "Start time required";
    if (!fmtTime(timeTo))      errs.deliveryEnd   = "End time required";
    else if (timeToMins(timeTo) <= timeToMins(timeFrom)) errs.deliveryEnd = "End time must be after start";

    if (Object.keys(errs).length) { setFieldErrors(errs); toast.error(Object.values(errs)[0]!); return; }
    setFieldErrors({});

    const payload = new FormData();
    payload.append("name",     form.name);
    payload.append("email",    form.email);
    payload.append("phone",    form.phone);
    payload.append("capacity", form.capacity);
    payload.append("delivery", `${fmtTime(timeFrom)} - ${fmtTime(timeTo)}`);
    payload.append("status",   String(form.status));
    payload.append("foodType", form.foodType);
    if (logoFile) payload.append("logo", logoFile);
    dispatch(addVendor(payload));
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-3 sm:p-6 lg:p-8">

      {newVendorCredentials && (
        <CredentialsModal
          name={newVendorCredentials.name}
          email={newVendorCredentials.email}
          password={newVendorCredentials.password}
          onDone={handleModalDone}
        />
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span onClick={() => navigate("/admin/vendors")}
            className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            Vendors
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Add New</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Add New Food Vendor</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Onboard a new restaurant partner to the MealBells platform.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm mb-6 sm:mb-8">
        {/* 1-col on mobile, 2-col on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">

          <Field label="Vendor Name" required error={fieldErrors.name} icon={User}>
            <input type="text" placeholder="e.g. Gourmet Kitchens" value={form.name}
              onChange={e => { set("name", e.target.value); clearErr("name"); }} className={inputCls} />
          </Field>

          <Field label="Business Email" required error={fieldErrors.email} icon={Mail}>
            <input type="email" placeholder="vendor@example.com" value={form.email}
              onChange={e => { set("email", e.target.value); clearErr("email"); }} className={inputCls} />
          </Field>

          <Field label="Phone Number" required error={fieldErrors.phone} icon={Phone}>
            <input type="text" placeholder="+1 (555) 000-0000" value={form.phone}
              onChange={e => { set("phone", e.target.value); clearErr("phone"); }} className={inputCls} />
          </Field>

          <Field label="Daily Meal Capacity" required error={fieldErrors.capacity} icon={List}>
            <input type="number" placeholder="500" min={1} value={form.capacity}
              onChange={e => { set("capacity", e.target.value); clearErr("capacity"); }} className={inputCls} />
          </Field>

          {/* Delivery Window — full width always */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={13} className="opacity-60" />
              Delivery Window <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-gray-400 font-semibold">From</p>
                <TimeDropdown value={timeFrom} placeholder="Start time" error={fieldErrors.deliveryStart}
                  onChange={v => { setTimeFrom(v); clearErr("deliveryStart"); if (fmtTime(timeTo) && timeToMins(timeTo) <= timeToMins(v)) setTimeTo(EMPTY_TIME); }} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-gray-400 font-semibold">To</p>
                <TimeDropdown value={timeTo} placeholder="End time" error={fieldErrors.deliveryEnd}
                  onChange={v => { setTimeTo(v); clearErr("deliveryEnd"); }} />
              </div>
            </div>
            {fmtTime(timeFrom) && fmtTime(timeTo) && timeToMins(timeTo) > timeToMins(timeFrom) && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 font-semibold">{fmtTime(timeFrom)} – {fmtTime(timeTo)}</p>
              </div>
            )}
          </div>

          {/* Status — full width on mobile, half on sm */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vendor Status</label>
            <div className="border border-gray-200 rounded-xl px-3 sm:px-4 h-11 sm:h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Status: <span className={`font-bold ${form.status ? "text-emerald-600" : "text-gray-400"}`}>
                  {form.status ? "Active" : "Inactive"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={e => set("status", e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>

        {/* Food Type */}
        <div className="mt-6 sm:mt-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">Food Type</p>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {["Veg", "Non-Veg", "Both"].map(type => (
              <button key={type} type="button" onClick={() => set("foodType", type)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
                  form.foodType === type
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500"
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mt-8 sm:mt-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">Company Logo</p>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver ? "border-orange-500 bg-orange-50/50" : "border-gray-200 bg-gray-50 hover:bg-gray-100/50"
            }`}>
            {form.logoPreview ? (
              <div className="flex flex-col items-center">
                <img src={form.logoPreview} alt="preview" className="max-h-20 sm:max-h-24 rounded-lg object-contain mb-3" />
                <button type="button"
                  onClick={e => { e.stopPropagation(); setLogoFile(null); set("logoPreview", null); }}
                  className="text-xs text-red-500 font-bold hover:underline">
                  Remove and replace
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <UploadCloud size={22} className="text-orange-500" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF · max 2MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>
        </div>

        <p className="mt-4 sm:mt-6 text-xs text-gray-400"><span className="text-red-400">*</span> Required fields</p>

        {/* Buttons — stacked on mobile, row on sm+ */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 border-t border-gray-100 pt-6 sm:pt-8">
          <button type="button" onClick={() => navigate("/admin/vendors")} disabled={adding}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50 text-center">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!isReady || adding}
            className={`bg-[#FF7A00] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              !isReady || adding
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
            }`}>
            {adding ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Vendor</>}
          </button>
        </div>
      </div>

      {/* Feature Highlights — 1 col mobile, 3 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-6 sm:pb-8">
        {[
          { icon: ShieldCheck, title: "Auto-Onboarding",  desc: "New vendors receive credentials via email instantly.", bg: "bg-blue-50",    iconBg: "bg-blue-100",    color: "text-blue-600",    titleColor: "text-blue-900"    },
          { icon: CheckCircle, title: "Compliance Check", desc: "Documentation is stored in central server vault.",    bg: "bg-emerald-50", iconBg: "bg-emerald-100", color: "text-emerald-600", titleColor: "text-emerald-900" },
          { icon: TrendingUp,  title: "Priority Listing", desc: "High-capacity vendors get priority placement.",       bg: "bg-orange-50",  iconBg: "bg-orange-100",  color: "text-orange-600",  titleColor: "text-orange-900"  },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-xl p-4 sm:p-5 border border-white/50`}>
            <div className={`${item.iconBg} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
              <item.icon size={18} className={item.color} />
            </div>
            <h3 className={`font-bold text-sm mb-1 sm:mb-1.5 ${item.titleColor}`}>{item.title}</h3>
            <p className={`text-[11px] leading-relaxed ${item.color} opacity-80`}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddVendor;