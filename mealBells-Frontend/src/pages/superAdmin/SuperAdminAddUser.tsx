import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { addSuperUser, clearNewUserCredentials } from "../../slices/superAdmin/superAdminUsersSlice";
import { fetchSuperOrgOptions } from "../../slices/superAdmin/superAdminAnalyticsSlice";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, Save, Loader2, UploadCloud,
  CheckCircle, Copy, Eye, EyeOff, ArrowRight, Building2, ChevronDown,
} from "lucide-react";
import DropDown from "../../components/shared/DropDown";
import { DEPARTMENTS, GENDER_OPTIONS } from "../../data/UserManagement";

type ErrorFields = Partial<Record<
  "fullName" | "email" | "phone" | "gender" | "department" | "orgId", string
>>;

// ── Credentials Modal (same as admin) ────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">User Created!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Share these login credentials with{" "}
            <span className="font-semibold text-gray-700">{name}</span>.
            <br />
            <span className="text-red-500 font-semibold">This password won't be shown again.</span>
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{email}</p>
            </div>
            <button onClick={() => copy(email, "email")}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-400 hover:text-orange-500 transition-colors">
              <Copy size={13} />{copiedEmail ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Temp Password</p>
              <p className="text-sm font-semibold text-gray-800 font-mono tracking-wider">
                {showPass ? password : "•".repeat(password?.length ?? 8)}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button onClick={() => setShowPass(p => !p)}
                className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-400 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => copy(password, "pass")}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-orange-200 hover:border-orange-400 hover:text-orange-500 transition-colors">
                <Copy size={13} />{copiedPass ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => { copy(`Email: ${email}\nPassword: ${password}`, "pass"); toast.success("Credentials copied!"); }}
          className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        >
          <Copy size={15} /> Copy Both
        </button>

        <button onClick={onDone}
          className="w-full bg-[#FF7A00] hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20">
          Go to Users <ArrowRight size={16} />
        </button>

        <p className="text-center text-[11px] text-gray-400 mt-3">
          The user can change their password after first login.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const SuperAdminAddUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { adding, error, newUserCredentials } = useSelector((s: RootState) => s.superUsers);
  const { orgOptions, filters } = useSelector((s: RootState) => s.superAnalytics);

  const fileRef    = useRef<HTMLInputElement>(null);
  const orgDropRef = useRef<HTMLDivElement>(null);

  const [orgDropOpen,  setOrgDropOpen]  = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [avatar,       setAvatar]       = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [fieldErrors,  setFieldErrors]  = useState<ErrorFields>({});

  const [formData, setFormData] = useState({
    fullName:   "",
    email:      "",
    phone:      "",
    gender:     "",
    department: "",
    active:     true,
    role:       "Standard User",
    orgId:      filters.orgId !== "all" ? filters.orgId : "",
  });

  // Load org options
  useEffect(() => {
    if (!orgOptions.length) dispatch(fetchSuperOrgOptions());
  }, [dispatch, orgOptions.length]);

  // Close org dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgDropRef.current && !orgDropRef.current.contains(e.target as Node))
        setOrgDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Error toast
  const prevAdding = useRef(false);
  useEffect(() => {
    if (prevAdding.current && !adding && error) toast.error(error);
    prevAdding.current = adding;
  }, [adding, error]);

  const selectedOrgLabel = orgOptions.find(o => o.value === formData.orgId)?.label ?? "";

  const isFormReady = useMemo(() =>
    !!(formData.fullName.trim() && formData.email.trim() &&
       formData.gender && formData.department && formData.orgId),
    [formData.fullName, formData.email, formData.gender, formData.department, formData.orgId]
  );

  const handleModalDone = () => {
    dispatch(clearNewUserCredentials());
    navigate("/super-admin/users");
  };

  const clearErr = useCallback((field: keyof ErrorFields) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error("Image must be under 2MB");      return; }
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (adding) return;
    const errs: ErrorFields = {};

    if (!formData.orgId)              errs.orgId     = "Please select an organization";
    if (!formData.fullName.trim())    errs.fullName   = "Full name is required";
    if (!formData.email.trim())       errs.email      = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
                                      errs.email      = "Please enter a valid email address";
    if (formData.phone.trim() && !/^\+?[\d\s\-().]{7,20}$/.test(formData.phone.trim()))
                                      errs.phone      = "Please enter a valid phone number";
    if (!formData.gender)             errs.gender     = "Please select a gender";
    if (!formData.department)         errs.department = "Please select a department";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast.error(Object.values(errs)[0]!);
      return;
    }
    setFieldErrors({});

    const payload = new FormData();
    payload.append("orgId",      formData.orgId);
    payload.append("fullName",   formData.fullName);
    payload.append("email",      formData.email);
    payload.append("phone",      formData.phone);
    payload.append("gender",     formData.gender);
    payload.append("department", formData.department);
    payload.append("role",       formData.role);
    payload.append("active",     String(formData.active));
    if (avatar) payload.append("avatar", avatar);

    dispatch(addSuperUser(payload));
  };

  const fieldBorder = (field: keyof ErrorFields) =>
    fieldErrors[field]
      ? "border-red-400 bg-red-50"
      : "border-gray-200 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500";

  const roles = [
    { title: "Standard User",   desc: "Access to standard features."   },
    { title: "Department Head", desc: "Manage team reporting."          },
    { title: "System Admin",    desc: "Full administrative access."     },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 sm:p-6 lg:p-8">

      {newUserCredentials && (
        <CredentialsModal
          name={newUserCredentials.name}
          email={newUserCredentials.email}
          password={newUserCredentials.password}
          onDone={handleModalDone}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span onClick={() => navigate("/super-admin/users")}
              className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              Users
            </span>
            <span className="text-gray-300 text-xs">/</span>
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Add New</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Add New User</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create a new team member under a specific organization.
          </p>
        </div>
        <button onClick={() => navigate("/super-admin/users")}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <span className="mr-1.5">←</span> Back to List
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 shadow-sm">

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 self-start">
            Profile Avatar
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`relative w-28 h-28 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${
              dragOver ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/40"
            }`}
          >
            {preview ? (
              <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <UploadCloud size={24} />
                <span className="text-[10px] font-semibold text-center leading-tight px-2">Upload Photo</span>
              </div>
            )}
            {preview && (
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadCloud size={20} className="text-white" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          {preview && (
            <button onClick={() => { setAvatar(null); setPreview(null); }}
              className="mt-3 text-xs text-red-500 font-bold hover:underline">
              Remove photo
            </button>
          )}
          <p className="mt-2 text-[11px] text-gray-400">PNG, JPG or GIF · max 2MB</p>
        </div>

        {/* Organization Selector — full width, first */}
        <div className="mb-6 sm:mb-8" ref={orgDropRef}>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Organization <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setOrgDropOpen(o => !o)}
            className={`relative w-full flex items-center border rounded-xl px-4 h-12 transition-all text-left ${
              fieldErrors.orgId
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-orange-400 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
            }`}
          >
            <Building2 size={17} className={fieldErrors.orgId ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
            <span className={`ml-3 flex-1 text-sm truncate ${formData.orgId ? "text-gray-700" : "text-gray-400"}`}>
              {formData.orgId ? selectedOrgLabel : "Select an organization…"}
            </span>
            <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${orgDropOpen ? "rotate-180" : ""}`} />
          </button>
          {fieldErrors.orgId && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.orgId}</p>}

          {orgDropOpen && (
            <div className="relative z-40">
              <div className="absolute top-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {orgOptions.length === 0 ? (
                  <p className="text-sm text-gray-400 px-4 py-3">No organizations found.</p>
                ) : orgOptions.map(org => (
                  <button
                    key={org.value}
                    type="button"
                    onClick={() => {
                      setFormData(f => ({ ...f, orgId: org.value }));
                      clearErr("orgId");
                      setOrgDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                      formData.orgId === org.value
                        ? "bg-orange-50 text-orange-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      formData.orgId === org.value ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-500"
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

        {/* Form Grid — identical to admin AddUser */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("fullName")}`}>
              <User size={18} className={fieldErrors.fullName ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input type="text" placeholder="e.g. John Doe" value={formData.fullName}
                onChange={e => { setFormData(f => ({ ...f, fullName: e.target.value })); clearErr("fullName"); }}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700" />
            </div>
            {fieldErrors.fullName && <p className="text-xs text-red-500 font-medium">{fieldErrors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("email")}`}>
              <Mail size={18} className={fieldErrors.email ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input type="email" placeholder="john.doe@company.com" value={formData.email}
                onChange={e => { setFormData(f => ({ ...f, email: e.target.value })); clearErr("email"); }}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700" />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Phone Number <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("phone")}`}>
              <Phone size={18} className={fieldErrors.phone ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input type="text" placeholder="+1 (555) 000-0000" value={formData.phone}
                onChange={e => { setFormData(f => ({ ...f, phone: e.target.value })); clearErr("phone"); }}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700" />
            </div>
            {fieldErrors.phone && <p className="text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className={`h-12 flex items-stretch rounded-xl border transition-all ${
              fieldErrors.gender ? "border-red-400 bg-red-50" : "border-transparent"
            }`}>
              <DropDown wfull value={formData.gender} options={GENDER_OPTIONS} placeholder="Select Gender"
                onChange={v => { setFormData(f => ({ ...f, gender: v })); clearErr("gender"); }} />
            </div>
            {fieldErrors.gender && <p className="text-xs text-red-500 font-medium">{fieldErrors.gender}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Department <span className="text-red-400">*</span>
            </label>
            <div className={`h-12 flex items-stretch rounded-xl border transition-all ${
              fieldErrors.department ? "border-red-400 bg-red-50" : "border-transparent"
            }`}>
              <DropDown wfull value={formData.department} options={DEPARTMENTS} placeholder="Select Department"
                onChange={v => { setFormData(f => ({ ...f, department: v })); clearErr("department"); }} />
            </div>
            {fieldErrors.department && <p className="text-xs text-red-500 font-medium">{fieldErrors.department}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account Status</label>
            <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Status: <span className={`font-bold ${formData.active ? "text-emerald-600" : "text-gray-400"}`}>
                  {formData.active ? "Active" : "Inactive"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.active}
                  onChange={e => setFormData(f => ({ ...f, active: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mt-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Initial Role Assignment
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.title} onClick={() => setFormData(f => ({ ...f, role: role.title }))}
                className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                  formData.role === role.title
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-gray-200 hover:border-orange-200 hover:bg-gray-50"
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    formData.role === role.title ? "border-orange-500" : "border-gray-300"
                  }`}>
                    {formData.role === role.title && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${formData.role === role.title ? "text-orange-900" : "text-gray-800"}`}>
                      {role.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{role.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400"><span className="text-red-400">*</span> Required fields</p>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-8 border-t border-gray-100 pt-8">
          <button onClick={() => navigate("/super-admin/users")} disabled={adding}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-center disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isFormReady || adding}
            className={`bg-[#FF7A00] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              !isFormReady || adding
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
            }`}>
            {adding ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save User</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAddUser;