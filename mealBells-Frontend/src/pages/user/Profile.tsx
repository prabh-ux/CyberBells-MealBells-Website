import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateMe, logoutUser } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";
import {
  ChevronLeft, ChevronRight, User, Lock,
  Salad, LogOut, Camera, Eye, EyeOff, Check,
  Save, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "profile" | "edit" | "password" | "notifications" | "dietary";

// ─── Shared sub-page header ───────────────────────────────────────────────────
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-2"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}

// ─── Edit Profile page ────────────────────────────────────────────────────────
function EditProfilePage({ onBack }: { onBack: () => void }) {
  const dispatch  = useDispatch<AppDispatch>();
  const { user, saving, error: sliceError } = useSelector((state: RootState) => state.auth);

  const [form, setForm]       = useState({
    name:  user?.name  ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [saved, setSaved]     = useState(false);
  const [localError, setLocalError] = useState("");
  const [preview, setPreview] = useState(user?.avatar ?? "");
  const fileRef               = useRef<HTMLInputElement>(null);
  const selectedFile          = useRef<File | null>(null);

  // Mirror slice error into local error display
  useEffect(() => {
    if (sliceError) setLocalError(sliceError);
  }, [sliceError]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFile.current = file;
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLocalError("");
    const fd = new FormData();
    if (form.name  !== user?.name)  fd.append("name",  form.name);
    if (form.email !== user?.email) fd.append("email", form.email);
    if (form.phone !== user?.phone) fd.append("phone", form.phone);
    if (selectedFile.current)       fd.append("avatar", selectedFile.current);

    const result = await dispatch(updateMe(fd));
    if (updateMe.fulfilled.match(result)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const avatarSrc = preview
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "U")}&background=f97316&color=fff`;

  return (
    <div>
      <SubHeader title="Edit Profile" onBack={onBack} />
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Avatar */}
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={form.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-100"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-sm text-gray-400">Click the camera to update your photo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm space-y-5">
          {([
            { label: "Full Name", key: "name",  type: "text"  },
            { label: "Email",     key: "email", type: "email" },
            { label: "Phone",     key: "phone", type: "tel"   },
          ] as { label: string; key: keyof typeof form; type: string }[]).map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
          ))}
          {localError && <p className="text-xs text-red-500 font-semibold">{localError}</p>}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 transition-all"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : saved
            ? <><Check className="w-4 h-4" /> Saved!</>
            : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ─── Change Password page (UI only — no password endpoint exists yet) ─────────
function ChangePasswordPage({ onBack }: { onBack: () => void }) {
  const [show, setShow]   = useState({ current: false, next: false, confirm: false });
  const [form, setForm]   = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  type Field = keyof typeof form;
  const set    = (k: Field) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = (k: keyof typeof show) =>
    setShow(s => ({ ...s, [k]: !s[k] }));

  const handleSave = () => {
    setError("");
    if (!form.current)              { setError("Enter your current password."); return; }
    if (form.next.length < 8)       { setError("New password must be at least 8 characters."); return; }
    if (form.next !== form.confirm) { setError("Passwords do not match."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ current: "", next: "", confirm: "" });
  };

  const fields: { label: string; key: Field; placeholder: string }[] = [
    { label: "Current Password", key: "current", placeholder: "Enter current password" },
    { label: "New Password",     key: "next",    placeholder: "At least 8 characters"  },
    { label: "Confirm Password", key: "confirm", placeholder: "Repeat new password"    },
  ];

  return (
    <div>
      <SubHeader title="Change Password" onBack={onBack} />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm space-y-5">
          {fields.map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                {label}
              </label>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 transition-all"
        >
          {saved
            ? <><Check className="w-4 h-4" /> Updated!</>
            : <><Lock className="w-4 h-4" /> Update Password</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Profile page ────────────────────────────────────────────────────────
const MENU_ITEMS: { page: Page; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { page: "edit",          label: "Edit Profile",          desc: "Update your name, email & photo",  icon: User  },
  { page: "password",      label: "Change Password",       desc: "Update your login credentials",    icon: Lock  },
  // { page: "notifications", label: "Notification Settings", desc: "Manage your alert preferences",    icon: Bell  },
  { page: "dietary",       label: "Dietary Preferences",   desc: "Veg / Non-veg, allergies & spice", icon: Salad },
];

export default function Profile() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
  const { user, loading, initialized } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState<Page>("profile");

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  // ── Loading — wait until authSlice has resolved fetchMe ──
  if (!initialized || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
      <div className="w-8 h-8 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
    </div>
  );

  // ── No session ──
  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F3] gap-3">
      <p className="text-sm text-gray-400">Could not load profile.</p>
      <button onClick={() => navigate("/login")} className="text-sm font-semibold text-orange-500">
        Go to Login
      </button>
    </div>
  );

  const avatarSrc = user.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=f97316&color=fff`;

  const department = user.department ?? user.role ?? "";

  // ── Sub pages ──
  if (page === "edit") return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <EditProfilePage onBack={() => setPage("profile")} />
      </div>
    </div>
  );

  if (page === "password") return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <ChangePasswordPage onBack={() => setPage("profile")} />
      </div>
    </div>
  );

  if (page === "notifications") return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <SubHeader title="Notification Settings" onBack={() => setPage("profile")} />
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm text-sm text-gray-400 text-center py-12">
          Coming soon
        </div>
      </div>
    </div>
  );

  if (page === "dietary") return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <SubHeader title="Dietary Preferences" onBack={() => setPage("profile")} />
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm text-sm text-gray-400 text-center py-12">
          Coming soon
        </div>
      </div>
    </div>
  );

  // ── Main profile ──
  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Avatar card ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setPage("edit")}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center mt-1">
                {department && (
                  <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-100">
                    {department}
                  </span>
                )}
                {user.phone && (
                  <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Menu list ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
              {MENU_ITEMS.map(({ page: p, label, desc, icon: Icon }, idx) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-orange-50 transition-colors text-left ${
                    idx < MENU_ITEMS.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}