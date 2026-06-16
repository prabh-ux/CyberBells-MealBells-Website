// pages/super-admin/SuperAdminEditOrganization.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  updateSuperOrganization,
  fetchSuperOrganizations,
} from "../../slices/superAdmin/superAdminOrganizationSlice";
import toast from "react-hot-toast";
import {
  Building2, Mail, MapPin, Clock, Users,
  Save, Loader2, UtensilsCrossed,
} from "lucide-react";

type ErrorFields = Partial<Record<
  "companyName" | "contactEmail" | "officeAddress" |
  "mealTime"    | "cutoffTime"   | "capacity", string
>>;

const Field = ({ label, required, error, icon: Icon, children }: {
  label: string; required?: boolean; error?: string;
  icon: React.ElementType; children: React.ReactNode;
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

export default function SuperAdminEditOrganization() {
  const { id }   = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { organizations, updating, updateError, filters } =
    useSelector((s: RootState) => s.superOrgs);

  const org = organizations.find(o => o._id === id) ?? null;

  const [fieldErrors,       setFieldErrors]       = useState<ErrorFields>({});
  const [allowDishRequests, setAllowDishRequests] = useState(true);
  const [status,            setStatus]            = useState(true);
  const [ready,             setReady]             = useState(false);

  const [form, setForm] = useState({
    companyName:   "",
    contactEmail:  "",
    officeAddress: "",
    mealTime:      "12:30",
    cutoffTime:    "09:00",
    capacity:      "",
  });

  const set      = useCallback((k: string, v: string) => setForm(f => ({ ...f, [k]: v })), []);
  const clearErr = (f: keyof ErrorFields) =>
    setFieldErrors(p => { const n = { ...p }; delete n[f]; return n; });

  // Populate form once org is available
  useEffect(() => {
    if (org && !ready) {
      setForm({
        companyName:   org.companyName,
        contactEmail:  org.contactEmail,
        officeAddress: org.officeAddress ?? "",
        mealTime:      org.mealTime,
        cutoffTime:    org.cutoffTime,
        capacity:      String(org.capacity || ""),
      });
      setAllowDishRequests(org.allowDishRequests);
      setStatus(org.status);
      setReady(true);
    }
  }, [org, ready]);

  // If org not in store, fetch
  useEffect(() => {
    if (!org) dispatch(fetchSuperOrganizations(filters));
  }, []);

  // Show update error as toast
  const prevUpdating = useRef(false);
  useEffect(() => {
    if (prevUpdating.current && !updating && updateError) toast.error(updateError);
    prevUpdating.current = !!updating;
  }, [updating, updateError]);

  const isReady =
    form.companyName.trim()  &&
    form.contactEmail.trim() &&
    form.officeAddress.trim()&&
    form.mealTime            &&
    form.cutoffTime          &&
    form.capacity;

  const handleSave = async () => {
    if (!id || updating) return;
    const errs: ErrorFields = {};

    if (!form.companyName.trim())   errs.companyName   = "Company name is required";
    if (!form.contactEmail.trim())  errs.contactEmail  = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
      errs.contactEmail = "Enter a valid email";
    if (!form.officeAddress.trim()) errs.officeAddress = "Office address is required";
    if (!form.mealTime)             errs.mealTime      = "Meal time is required";
    if (!form.cutoffTime)           errs.cutoffTime    = "Cutoff time is required";
    else if (form.cutoffTime >= form.mealTime)
      errs.cutoffTime = "Cutoff must be before meal time";
    if (!form.capacity || Number(form.capacity) <= 0)
      errs.capacity = "Capacity must be greater than 0";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast.error(Object.values(errs)[0]!);
      return;
    }
    setFieldErrors({});

    const result = await dispatch(updateSuperOrganization({
      id,
      body: {
        companyName:       form.companyName.trim(),
        contactEmail:      form.contactEmail.trim(),
        officeAddress:     form.officeAddress.trim(),
        mealTime:          form.mealTime,
        cutoffTime:        form.cutoffTime,
        allowDishRequests,
        capacity:          Number(form.capacity),
        status,
      } as any,
    }));

    if (updateSuperOrganization.fulfilled.match(result)) {
      toast.success("Organization updated!");
      navigate("/super-admin/organizations");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading organization…</p>
      </div>
    );
  }

  const isSaving = updating === id;

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-3 sm:p-6 lg:p-8">

      {/* Breadcrumb + header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span onClick={() => navigate("/super-admin/organizations")}
            className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            Organizations
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Edit</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Edit Organization</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Editing: <span className="font-semibold text-gray-700">{org?.companyName}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm mb-6 sm:mb-8 space-y-8">

        {/* ── Organization Details ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-5">
            Organization Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            <Field label="Company Name" required error={fieldErrors.companyName} icon={Building2}>
              <input type="text" placeholder="e.g. Infosys Bangalore" value={form.companyName}
                onChange={e => { set("companyName", e.target.value); clearErr("companyName"); }}
                className={inputCls} />
            </Field>

            <Field label="Contact Email" required error={fieldErrors.contactEmail} icon={Mail}>
              <input type="email" placeholder="contact@company.com" value={form.contactEmail}
                onChange={e => { set("contactEmail", e.target.value); clearErr("contactEmail"); }}
                className={inputCls} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Office Address" required error={fieldErrors.officeAddress} icon={MapPin}>
                <input type="text" placeholder="123 Main St, City" value={form.officeAddress}
                  onChange={e => { set("officeAddress", e.target.value); clearErr("officeAddress"); }}
                  className={inputCls} />
              </Field>
            </div>

            <Field label="Meal Time" required error={fieldErrors.mealTime} icon={UtensilsCrossed}>
              <input type="time" value={form.mealTime}
                onChange={e => { set("mealTime", e.target.value); clearErr("mealTime"); }}
                className={inputCls} />
            </Field>

            <Field label="Attendance Cutoff" required error={fieldErrors.cutoffTime} icon={Clock}>
              <input type="time" value={form.cutoffTime}
                onChange={e => { set("cutoffTime", e.target.value); clearErr("cutoffTime"); }}
                className={inputCls} />
            </Field>

            <Field label="Daily Capacity" required error={fieldErrors.capacity} icon={Users}>
              <input type="number" placeholder="e.g. 500" min={1} value={form.capacity}
                onChange={e => { set("capacity", e.target.value); clearErr("capacity"); }}
                className={inputCls} />
            </Field>
          </div>

          {/* Toggles */}
          <div className="mt-5 space-y-3">
            <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                Status:{" "}
                <span className={`font-bold ${status ? "text-emerald-600" : "text-gray-400"}`}>
                  {status ? "Active" : "Inactive"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                Allow dish requests:{" "}
                <span className={`font-bold ${allowDishRequests ? "text-emerald-600" : "text-gray-400"}`}>
                  {allowDishRequests ? "Yes" : "No"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={allowDishRequests} onChange={e => setAllowDishRequests(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400"><span className="text-red-400">*</span> Required fields</p>

        {/* Footer buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button onClick={() => navigate("/super-admin/organizations")} disabled={isSaving}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50 text-center">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isReady || isSaving}
            className={`bg-[#EA580C] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              !isReady || isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-700 shadow-lg shadow-orange-500/20 active:scale-95"
            }`}>
            {isSaving
              ? <><Loader2 size={18} className="animate-spin" /> Saving…</>
              : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}