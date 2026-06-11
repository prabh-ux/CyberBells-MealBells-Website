import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  createVendorOrg,
  clearNewOrgCredentials,
  clearCreateError,
} from "../../slices/organizationSlice";
import toast from "react-hot-toast";
import {
  Building2, Mail, Phone, MapPin, Clock,
  User, Save, CheckCircle, Loader2, Copy,
  Eye, EyeOff, ArrowRight, UtensilsCrossed, Users,
} from "lucide-react";

type ErrorFields = Partial<Record<
  "companyName" | "contactEmail" | "officeAddress" | "mealTime" |
  "cutoffTime"  | "capacity"    | "adminName"      | "adminEmail" | "adminPhone", string
>>;

const Field = ({
  label, required, error, icon: Icon, children,
}: {
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

function CredentialsModal({ orgName, adminName, adminEmail, adminPassword, onDone }: {
  orgName: string; adminName: string; adminEmail: string;
  adminPassword: string; onDone: () => void;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-8">
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Organization Created!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Share these login credentials with{" "}
            <span className="font-semibold text-gray-700">{adminName}</span> — admin of{" "}
            <span className="font-semibold text-gray-700">{orgName}</span>.
            <br />
            <span className="text-red-500 font-semibold">This password won't be shown again.</span>
          </p>
        </div>

        <div className="space-y-3 mb-5 sm:mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Admin Email</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{adminEmail}</p>
            </div>
            <button
              onClick={() => copy(adminEmail, "email")}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <Copy size={13} />{copiedEmail ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Temp Password</p>
              <p className="text-sm font-semibold text-gray-800 font-mono tracking-wider">
                {showPass ? adminPassword : "•".repeat(adminPassword.length)}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowPass(p => !p)}
                className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-400 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={() => copy(adminPassword, "pass")}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-orange-200 hover:border-orange-400 hover:text-orange-500 transition-colors"
              >
                <Copy size={13} />{copiedPass ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            copy(`Email: ${adminEmail}\nPassword: ${adminPassword}`, "pass");
            toast.success("Credentials copied!");
          }}
          className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        >
          <Copy size={15} /> Copy Both
        </button>

        <button
          onClick={onDone}
          className="w-full bg-[#FF7A00] hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
        >
          Go to Organizations <ArrowRight size={16} />
        </button>

        <p className="text-center text-[11px] text-gray-400 mt-3">
          The admin can change their password after first login.
        </p>
      </div>
    </div>
  );
}

export default function AddOrganization() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { creating, createError, newOrgCredentials } =
    useSelector((s: RootState) => s.organization);

  const [fieldErrors, setFieldErrors] = useState<ErrorFields>({});
  const [allowDishRequests, setAllowDishRequests] = useState(true);

  const [form, setForm] = useState({
    companyName:   "",
    contactEmail:  "",
    officeAddress: "",
    mealTime:      "",
    cutoffTime:    "",
    capacity:      "",
    adminName:     "",
    adminEmail:    "",
    adminPhone:    "",
  });

  const set      = useCallback((k: string, v: string) => setForm(f => ({ ...f, [k]: v })), []);
  const clearErr = (f: keyof ErrorFields) => setFieldErrors(p => { const n = { ...p }; delete n[f]; return n; });

  const prevCreating = useRef(false);
  useEffect(() => {
    if (prevCreating.current && !creating && createError) {
      toast.error(createError);
      dispatch(clearCreateError());
    }
    prevCreating.current = creating;
  }, [creating, createError, dispatch]);

  const handleModalDone = () => {
    dispatch(clearNewOrgCredentials());
    navigate("/vendor/organizations");
  };

  const handleSave = () => {
    if (creating) return;
    const errs: ErrorFields = {};

    if (!form.companyName.trim())   errs.companyName   = "Company name is required";
    if (!form.contactEmail.trim())  errs.contactEmail  = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
      errs.contactEmail = "Enter a valid email";
    if (!form.officeAddress.trim()) errs.officeAddress = "Office address is required";
    if (!form.mealTime.trim())      errs.mealTime      = "Meal time is required";
    if (!form.cutoffTime.trim())    errs.cutoffTime    = "Cutoff time is required";
    else if (form.mealTime && form.cutoffTime >= form.mealTime)
      errs.cutoffTime = "Cutoff must be before meal time";
    if (!form.capacity || Number(form.capacity) <= 0)
      errs.capacity = "Capacity must be greater than 0";
    if (!form.adminName.trim())     errs.adminName     = "Admin name is required";
    if (!form.adminEmail.trim())    errs.adminEmail    = "Admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim()))
      errs.adminEmail = "Enter a valid admin email";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast.error(Object.values(errs)[0]!);
      return;
    }
    setFieldErrors({});

    dispatch(createVendorOrg({
      companyName:       form.companyName.trim(),
      contactEmail:      form.contactEmail.trim(),
      officeAddress:     form.officeAddress.trim(),
      mealTime:          form.mealTime,
      cutoffTime:        form.cutoffTime,
      capacity:          Number(form.capacity),
      allowDishRequests,
      adminName:         form.adminName.trim(),
      adminEmail:        form.adminEmail.trim(),
      adminPhone:        form.adminPhone.trim() || undefined,
    }));
  };

  const isReady =
    form.companyName.trim()   &&
    form.contactEmail.trim()  &&
    form.officeAddress.trim() &&
    form.mealTime             &&
    form.cutoffTime           &&
    form.capacity             &&
    form.adminName.trim()     &&
    form.adminEmail.trim();

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-3 sm:p-6 lg:p-8">

      {newOrgCredentials && (
        <CredentialsModal
          orgName={newOrgCredentials.orgName}
          adminName={newOrgCredentials.adminName}
          adminEmail={newOrgCredentials.adminEmail}
          adminPassword={newOrgCredentials.adminPassword}
          onDone={handleModalDone}
        />
      )}

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            onClick={() => navigate("/vendor/organizations")}
            className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            Organizations
          </span>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Add New</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Add New Organization</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Create a new client organization and set up their admin account.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm mb-6 sm:mb-8 space-y-8">

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-5">
            Organization Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            <Field label="Company Name" required error={fieldErrors.companyName} icon={Building2}>
              <input
                type="text" placeholder="e.g. Acme Corp" value={form.companyName}
                onChange={e => { set("companyName", e.target.value); clearErr("companyName"); }}
                className={inputCls}
              />
            </Field>

            <Field label="Contact Email" required error={fieldErrors.contactEmail} icon={Mail}>
              <input
                type="email" placeholder="contact@acme.com" value={form.contactEmail}
                onChange={e => { set("contactEmail", e.target.value); clearErr("contactEmail"); }}
                className={inputCls}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Office Address" required error={fieldErrors.officeAddress} icon={MapPin}>
                <input
                  type="text" placeholder="123 Main St, City" value={form.officeAddress}
                  onChange={e => { set("officeAddress", e.target.value); clearErr("officeAddress"); }}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Meal Time" required error={fieldErrors.mealTime} icon={UtensilsCrossed}>
              <input
                type="time" value={form.mealTime}
                onChange={e => { set("mealTime", e.target.value); clearErr("mealTime"); }}
                className={inputCls}
              />
            </Field>

            <Field label="Attendance Cutoff" required error={fieldErrors.cutoffTime} icon={Clock}>
              <input
                type="time" value={form.cutoffTime}
                onChange={e => { set("cutoffTime", e.target.value); clearErr("cutoffTime"); }}
                className={inputCls}
              />
            </Field>

            <Field label="Daily Capacity" required error={fieldErrors.capacity} icon={Users}>
              <input
                type="number" placeholder="e.g. 200" value={form.capacity} min={1}
                onChange={e => { set("capacity", e.target.value); clearErr("capacity"); }}
                className={inputCls}
              />
            </Field>

          </div>

          <div className="mt-5 border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Allow dish requests:{" "}
              <span className={`font-bold ${allowDishRequests ? "text-emerald-600" : "text-gray-400"}`}>
                {allowDishRequests ? "Yes" : "No"}
              </span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox" checked={allowDishRequests}
                onChange={e => setAllowDishRequests(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
            Admin Account
          </p>
          <p className="text-xs text-gray-400 mb-5">
            This person will manage the organization's settings and users.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            <Field label="Admin Name" required error={fieldErrors.adminName} icon={User}>
              <input
                type="text" placeholder="Jane Doe" value={form.adminName}
                onChange={e => { set("adminName", e.target.value); clearErr("adminName"); }}
                className={inputCls}
              />
            </Field>

            <Field label="Admin Email" required error={fieldErrors.adminEmail} icon={Mail}>
              <input
                type="email" placeholder="jane@acme.com" value={form.adminEmail}
                onChange={e => { set("adminEmail", e.target.value); clearErr("adminEmail"); }}
                className={inputCls}
              />
            </Field>

            <Field label="Admin Phone" error={fieldErrors.adminPhone} icon={Phone}>
              <input
                type="text" placeholder="+1 (555) 000-0000" value={form.adminPhone}
                onChange={e => { set("adminPhone", e.target.value); clearErr("adminPhone"); }}
                className={inputCls}
              />
            </Field>

          </div>
        </div>

        <p className="text-xs text-gray-400"><span className="text-red-400">*</span> Required fields</p>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button
            type="button" onClick={() => navigate("/vendor/organizations")} disabled={creating}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSave} disabled={!isReady || creating}
            className={`bg-[#FF7A00] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              !isReady || creating
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
            }`}
          >
            {creating
              ? <><Loader2 size={18} className="animate-spin" /> Creating…</>
              : <><Save size={18} /> Create Organization</>
            }
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-6 sm:pb-8">
        {[
          { icon: CheckCircle, title: "Instant Admin Access",  desc: "Admin credentials are generated and ready to share immediately.",   bg: "bg-blue-50",    iconBg: "bg-blue-100",    color: "text-blue-600",    titleColor: "text-blue-900" },
          { icon: Clock,       title: "Cutoff Enforcement",    desc: "Attendance is automatically locked after the cutoff time you set.", bg: "bg-emerald-50", iconBg: "bg-emerald-100", color: "text-emerald-600", titleColor: "text-emerald-900" },
          { icon: Building2,   title: "Isolated Data",         desc: "Each org's attendance, reviews, and menus are fully separated.",    bg: "bg-orange-50",  iconBg: "bg-orange-100",  color: "text-orange-600",  titleColor: "text-orange-900" },
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
}