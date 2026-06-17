import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchSuperVendors,
  updateSuperVendor,
} from "../../slices/superAdmin/superAdminVendorSlice";
import { fetchSuperOrgOptions } from "../../slices/superAdmin/superAdminAnalyticsSlice";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, Save, Clock, List, Building2,
  UploadCloud, Loader2, ChevronDown, ArrowLeft,
} from "lucide-react";
import TimeDropdown, {
  EMPTY_TIME,
  fmtTime,
  timeToMins,
  type TimeValue,
} from "../../components/shared/Timedropdown";

// ── Types ─────────────────────────────────────────────────────────────────────

type ErrorFields = Partial<Record<
  "name" | "email" | "phone" | "capacity" | "deliveryStart" | "deliveryEnd" | "orgId",
  string
>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDeliveryWindow(raw: string): [TimeValue, TimeValue] {
  const parts = raw?.split(" - ") ?? [];
  const parse = (s?: string): TimeValue => {
    if (!s) return { ...EMPTY_TIME };
    const match = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { ...EMPTY_TIME };
    return { h: match[1], m: match[2], p: match[3].toUpperCase() };
  };
  return [parse(parts[0]), parse(parts[1])];
}
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

const inputCls =
  "w-full ml-2.5 sm:ml-3 outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400";

// ── Skeleton loader ───────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="min-h-screen bg-[#f7f7f7] p-3 sm:p-6 lg:p-8 animate-pulse">
    <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
    <div className="h-8 w-56 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-72 bg-gray-200 rounded mb-8" />
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-11 bg-gray-100 rounded-xl" />
      ))}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const SuperAdminEditVendor = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  // ── Replaced: use vendors list + find by id instead of editing/loadingOne ──
  const { vendors, loading, updating, updateError } =
    useSelector((s: RootState) => s.superVendors);
  const vendor = useMemo(() => vendors.find(v => v._id === id), [vendors, id]);

  const { orgOptions } = useSelector((s: RootState) => s.superAnalytics);

  const fileRef    = useRef<HTMLInputElement>(null);
  const orgDropRef = useRef<HTMLDivElement>(null);

  const [orgDropOpen, setOrgDropOpen] = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErrorFields>({});
  const [timeFrom,    setTimeFrom]    = useState<TimeValue>(EMPTY_TIME);
  const [timeTo,      setTimeTo]      = useState<TimeValue>(EMPTY_TIME);
  const [populated,   setPopulated]   = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", capacity: "",
    status: true, foodType: "Both", orgId: "",
    logoPreview: null as string | null,
  });

  const set      = useCallback((k: string, v: unknown) => setForm(f => ({ ...f, [k]: v })), []);
  const clearErr = (f: keyof ErrorFields) =>
    setFieldErrors(p => { const n = { ...p }; delete n[f]; return n; });

  // If vendors list is empty (e.g. navigated directly), fetch it
  useEffect(() => {
    if (!vendors.length) {
      dispatch(fetchSuperVendors({ orgId: "all", status: "all", foodType: "all" }));
    }
    if (!orgOptions.length) dispatch(fetchSuperOrgOptions());
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form once vendor is available from the list
  useEffect(() => {
    if (!vendor || populated) return;
    const [from, to] = parseDeliveryWindow(vendor.deliveryTiming ?? "");
    setTimeFrom(from);
    setTimeTo(to);
    setForm({
      name:        vendor.name        ?? "",
      email:       vendor.email       ?? "",
      phone:       vendor.phone       ?? "",
      capacity:    String(vendor.capacity ?? ""),
      status:      vendor.status      ?? true,
      foodType:    vendor.foodType    ?? "Both",
      orgId:       typeof vendor.organizationId?.[0] === "string"
                     ? (vendor.organizationId[0] as string)
                     : ((vendor.organizationId?.[0] as { _id: string })?._id ?? ""),
      logoPreview: vendor.logo        ?? null,
    });
    setPopulated(true);
  }, [vendor, populated]);

  // Close org dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgDropRef.current && !orgDropRef.current.contains(e.target as Node))
        setOrgDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // React to update completing
  const prevUpdating = useRef(false);
  useEffect(() => {
    if (prevUpdating.current && !updating) {
      if (!updateError) {
        toast.success("Vendor updated!");
        navigate("/super-admin/vendors");
      } else {
        toast.error(updateError);
      }
    }
    prevUpdating.current = !!updating;
  }, [updating, updateError, navigate]);

  const selectedOrgLabel =
    orgOptions.find(o => o.value === form.orgId)?.label ?? "";

  const isReady = useMemo(() =>
    !!(form.name.trim() && form.email.trim() && form.phone.trim() &&
      form.capacity.trim() && fmtTime(timeFrom) && fmtTime(timeTo) && form.orgId),
    [form.name, form.email, form.phone, form.capacity, form.orgId, timeFrom, timeTo]
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error("Max 2MB");      return; }
    setLogoFile(file);
    set("logoPreview", URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (updating) return;
    const errs: ErrorFields = {};
    if (!form.orgId)           errs.orgId = "Please select an organization";
    if (!form.name.trim())     errs.name  = "Vendor name is required";
    if (!form.email.trim())    errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                               errs.email = "Enter a valid email";
    if (!form.phone.trim())    errs.phone = "Phone is required";
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim()))
                               errs.phone = "Enter a valid phone number";
    if (!form.capacity.trim()) errs.capacity = "Capacity is required";
    else if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0)
                               errs.capacity = "Must be a positive number";
    if (!fmtTime(timeFrom))    errs.deliveryStart = "Start time required";
    if (!fmtTime(timeTo))      errs.deliveryEnd   = "End time required";
    else if (timeToMins(timeTo) <= timeToMins(timeFrom))
                               errs.deliveryEnd = "End time must be after start";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast.error(Object.values(errs)[0]!);
      return;
    }
    setFieldErrors({});

    const payload = new FormData();
    payload.append("name",     form.name);
    payload.append("email",    form.email);
    payload.append("phone",    form.phone);
    payload.append("capacity", form.capacity);
    payload.append("delivery", `${fmtTime(timeFrom)} - ${fmtTime(timeTo)}`);
    payload.append("status",   String(form.status));
    payload.append("foodType", form.foodType);
    payload.append("orgId",    form.orgId);
    if (logoFile) payload.append("logo", logoFile);

    dispatch(updateSuperVendor({ id: id!, formData: payload }));
  };

  // Show skeleton while vendors are loading or form not yet populated
  if (loading || !populated) return <Skeleton />;

  // Vendor not found in list after loading
  if (!vendor) return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-gray-500 text-sm">Vendor not found.</p>
        <button
          onClick={() => navigate("/super-admin/vendors")}
          className="text-xs font-semibold text-orange-500 hover:underline"
        >
          ← Back to Vendors
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-3 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            onClick={() => navigate("/super-admin/vendors")}
            className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            Vendors
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Edit</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              Edit Vendor
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Update details for <span className="font-semibold text-gray-700">{vendor.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/super-admin/vendors")}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-xl px-3 py-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Vendors
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">

          {/* Organization selector */}
          <div className="sm:col-span-2 space-y-1.5" ref={orgDropRef}>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Organization <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setOrgDropOpen(o => !o)}
              className={`relative w-full flex items-center border rounded-xl px-3 sm:px-4 h-11 sm:h-12 transition-all text-left ${
                fieldErrors.orgId
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:border-orange-400 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
              }`}
            >
              <Building2
                size={17}
                className={fieldErrors.orgId ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"}
              />
              <span className={`ml-2.5 flex-1 text-sm truncate ${
                form.orgId ? "text-gray-700" : "text-gray-400"
              }`}>
                {form.orgId ? selectedOrgLabel : "Select an organization…"}
              </span>
              <ChevronDown
                size={15}
                className={`text-gray-400 transition-transform duration-200 ${orgDropOpen ? "rotate-180" : ""}`}
              />
            </button>
            {fieldErrors.orgId && (
              <p className="text-xs text-red-500 font-medium">{fieldErrors.orgId}</p>
            )}
            {orgDropOpen && (
              <div className="relative z-40">
                <div className="absolute top-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {orgOptions.length === 0 ? (
                    <p className="text-sm text-gray-400 px-4 py-3">No organizations found.</p>
                  ) : orgOptions.map(org => (
                    <button
                      key={org.value}
                      type="button"
                      onClick={() => { set("orgId", org.value); clearErr("orgId"); setOrgDropOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                        form.orgId === org.value
                          ? "bg-orange-50 text-orange-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        form.orgId === org.value
                          ? "bg-orange-100 text-orange-500"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {org.label?.[0]?.toUpperCase() ?? "O"}
                      </div>
                      <span className="truncate">{org.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <Field label="Vendor Name" required error={fieldErrors.name} icon={User}>
            <input
              type="text"
              placeholder="e.g. Gourmet Kitchens"
              value={form.name}
              onChange={e => { set("name", e.target.value); clearErr("name"); }}
              className={inputCls}
            />
          </Field>

          {/* Email */}
          <Field label="Business Email" required error={fieldErrors.email} icon={Mail}>
            <input
              type="email"
              placeholder="vendor@example.com"
              value={form.email}
              onChange={e => { set("email", e.target.value); clearErr("email"); }}
              className={inputCls}
            />
          </Field>

          {/* Phone */}
          <Field label="Phone Number" required error={fieldErrors.phone} icon={Phone}>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => { set("phone", e.target.value); clearErr("phone"); }}
              className={inputCls}
            />
          </Field>

          {/* Capacity */}
          <Field label="Daily Meal Capacity" required error={fieldErrors.capacity} icon={List}>
            <input
              type="number"
              placeholder="500"
              min={1}
              value={form.capacity}
              onChange={e => { set("capacity", e.target.value); clearErr("capacity"); }}
              className={inputCls}
            />
          </Field>

          {/* Delivery Window */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={13} className="opacity-60" />
              Delivery Window <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-gray-400 font-semibold">From</p>
                <TimeDropdown
                  value={timeFrom}
                  placeholder="Start time"
                  error={fieldErrors.deliveryStart}
                  onChange={v => {
                    setTimeFrom(v);
                    clearErr("deliveryStart");
                    if (fmtTime(timeTo) && timeToMins(timeTo) <= timeToMins(v)) setTimeTo(EMPTY_TIME);
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-gray-400 font-semibold">To</p>
                <TimeDropdown
                  value={timeTo}
                  placeholder="End time"
                  error={fieldErrors.deliveryEnd}
                  onChange={v => { setTimeTo(v); clearErr("deliveryEnd"); }}
                />
              </div>
            </div>
            {fmtTime(timeFrom) && fmtTime(timeTo) && timeToMins(timeTo) > timeToMins(timeFrom) && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
                <Clock size={13} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 font-semibold">
                  {fmtTime(timeFrom)} – {fmtTime(timeTo)}
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Vendor Status
            </label>
            <div className="border border-gray-200 rounded-xl px-3 sm:px-4 h-11 sm:h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Status:{" "}
                <span className={`font-bold ${form.status ? "text-emerald-600" : "text-gray-400"}`}>
                  {form.status ? "Active" : "Inactive"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={e => set("status", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>

        {/* Food Type */}
        <div className="mt-6 sm:mt-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
            Food Type
          </p>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {["Veg", "Non-Veg", "Both"].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => set("foodType", type)}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
                  form.foodType === type
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mt-8 sm:mt-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
            Company Logo
          </p>
          <p className="text-xs text-gray-400 mb-3 sm:mb-4">
            Upload a new logo to replace the existing one, or leave blank to keep it.
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-orange-500 bg-orange-50/50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100/50"
            }`}
          >
            {form.logoPreview ? (
              <div className="flex flex-col items-center">
                <img
                  src={form.logoPreview}
                  alt="Logo preview"
                  className="max-h-20 sm:max-h-24 rounded-lg object-contain mb-3"
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setLogoFile(null); set("logoPreview", null); }}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Remove and replace
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <UploadCloud size={22} className="text-orange-500" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF · max 2MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        </div>

        <p className="mt-4 sm:mt-6 text-xs text-gray-400">
          <span className="text-red-400">*</span> Required fields
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 border-t border-gray-100 pt-6 sm:pt-8">
          <button
            type="button"
            onClick={() => navigate("/super-admin/vendors")}
            disabled={!!updating}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isReady || !!updating}
            className={`bg-[#FF7A00] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              !isReady || updating
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
            }`}
          >
            {updating
              ? <><Loader2 size={18} className="animate-spin" /> Saving…</>
              : <><Save size={18} /> Update Vendor</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminEditVendor;