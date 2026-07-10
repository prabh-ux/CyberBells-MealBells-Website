import React, { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateMe, logoutUser } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";
import axiosInstance from "../../app/axiosInstance";
import toast from "react-hot-toast";
import {
  ChevronLeft, ChevronRight, User, Lock, Clock,
  Bell, LogOut, Camera, Eye, EyeOff, Check,
  Save, Loader2, MessageCircle, Phone, Mail,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "main" | "edit" | "password" | "delivery-timing" | "notifications";

// ─── Shared sub-page header ───────────────────────────────────────────────────
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${on ? "bg-orange-500" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", icon: Icon, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: React.FC<{ className?: string }>; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <div className="relative">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"><Icon className="w-4 h-4" /></div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition ${Icon ? "pl-11 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────
function SaveBtn({
  saving, saved, onClick, label = "Save Changes", icon: Icon = Save,
}: {
  saving?: boolean; saved?: boolean; onClick: () => void;
  label?: string; icon?: React.FC<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 transition-all"
    >
      {saving
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        : saved
        ? <><Check className="w-4 h-4" /> Saved!</>
        : <><Icon className="w-4 h-4" /> {label}</>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function EditProfilePage({ onBack }: { onBack: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, saving, error: sliceError } = useSelector((s: RootState) => s.auth);

  const [form, setForm] = useState({
    name:  user?.name  ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [saved, setSaved]           = useState(false);
  const [localError, setLocalError] = useState("");
  const [preview, setPreview]       = useState(user?.avatar ?? "");
  const fileRef                     = useRef<HTMLInputElement>(null);
  const selectedFile                = useRef<File | null>(null);

  useEffect(() => { if (sliceError) setLocalError(sliceError); }, [sliceError]);

  const set = (k: keyof typeof form) => (v: string) => {
    if (k === "name")  v = v.replace(/[^A-Za-z\s]/g, "");
    if (k === "phone") v = v.replace(/[^0-9]/g, "");
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFile.current = file;
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLocalError("");

    if (form.name && form.name.trim().length < 2) {
      setLocalError("Name is too short.");
      return;
    }
    if (form.name && !/^[A-Za-z\s]+$/.test(form.name)) {
      setLocalError("Name can only contain letters and spaces.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      setLocalError("Phone number must be 10 digits.");
      return;
    }

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Avatar card */}
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col items-center gap-4">
          <div className="relative">
            <img src={avatarSrc} alt={form.name} className="w-28 h-28 rounded-full object-cover ring-4 ring-orange-100" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">{form.name || "—"}</p>
            <p className="text-xs text-gray-400 mt-1">Click camera to update photo</p>
          </div>
          <div className="w-full pt-4 border-t border-gray-50 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
              <Mail className="w-3.5 h-3.5 text-orange-300 shrink-0" />{form.email}
            </div>
            {form.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Phone className="w-3.5 h-3.5 text-orange-300 shrink-0" />{form.phone}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Account Info</p>
            <Field label="Full Name" value={form.name}  onChange={set("name")}  icon={User} />
            <Field label="Email"     value={form.email} onChange={set("email")} icon={Mail} type="email" />
            <Field label="Phone"     value={form.phone} onChange={set("phone")} icon={Phone} type="tel" placeholder="e.g. +1 555 000 0000" />
            {localError && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{localError}
              </p>
            )}
          </div>
          <SaveBtn saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD — wired to real API
// ═══════════════════════════════════════════════════════════════════════════════
function ChangePasswordPage({ onBack }: { onBack: () => void }) {
  const [show,   setShow]   = useState({ current: false, next: false, confirm: false });
  const [form,   setForm]   = useState({ current: "", next: "", confirm: "" });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  type F = keyof typeof form;
  const set    = (k: F) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k: keyof typeof show) => setShow(s => ({ ...s, [k]: !s[k] }));

  const handleSave = async () => {
    setError("");
    if (!form.current)                 { setError("Enter your current password."); return; }
if (form.next.length < 8)          { setError("New password must be at least 8 characters."); return; }
if (form.next !== form.confirm)    { setError("Passwords do not match."); return; }

    try {
      setSaving(true);
      await axiosInstance.post("/auth/me/change-password", {
        currentPassword: form.current,
        newPassword:     form.next,
      });
      toast.success("Password updated successfully!");
      setSaved(true);
      setForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.msg ?? "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const strength = form.next.length === 0 ? 0
    : form.next.length < 8 ? 1
    : form.next.match(/[A-Z]/) && form.next.match(/[0-9]/) && form.next.length >= 12 ? 3
    : 2;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-green-400"];

  const fields: { label: string; key: F; placeholder: string }[] = [
    { label: "Current Password", key: "current", placeholder: "Enter current password" },
    { label: "New Password",     key: "next",    placeholder: "At least 8 characters"  },
    { label: "Confirm Password", key: "confirm", placeholder: "Repeat new password"    },
  ];

  return (
    <div>
      <SubHeader title="Change Password" onBack={onBack} />
      <div className="max-w-7xl space-y-6">
        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 leading-relaxed">
              Use a strong password with uppercase, lowercase, numbers &amp; symbols. Never share your password.
            </p>
          </div>

          {fields.map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</label>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  value={form[key]}
                  onChange={e => set(key)(e.target.value)}
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

              {/* Password strength bar — only on new password field */}
              {key === "next" && form.next.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor[strength] : "bg-gray-100"}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-500" : "text-green-500"}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>
          ))}

          {error && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </p>
          )}
        </div>

        <SaveBtn saving={saving} saved={saved} onClick={handleSave} label="Update Password" icon={Lock} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY TIMING — Coming Soon
// ═══════════════════════════════════════════════════════════════════════════════
function DeliveryTimingPage({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <SubHeader title="Delivery Timing Settings" onBack={onBack} />
      <div className="max-w-7xl">
        <div className="bg-white rounded-[24px] p-12 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-[20px] bg-orange-50 flex items-center justify-center">
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">Coming Soon</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Delivery timing settings are under development and will be available in a future update.
            </p>
          </div>
          <span className="bg-orange-50 text-orange-500 text-xs font-bold px-4 py-1.5 rounded-full border border-orange-100 tracking-wide uppercase">
            In Progress
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════════
type NotifGroup = { label: string; key: string; desc: string };
const NOTIF_GROUPS: { section: string; items: NotifGroup[] }[] = [
  {
    section: "Order Alerts",
    items: [
      { label: "New Orders",             key: "new_order",    desc: "Alert when a new order is placed"   },
      { label: "Order Cancellations",    key: "order_cancel", desc: "Notify when a customer cancels"     },
      { label: "Order Ready for Pickup", key: "order_ready",  desc: "Confirm when driver picks up"       },
    ],
  },
  {
    section: "Delivery & Payments",
    items: [
      { label: "Delivery Updates", key: "delivery", desc: "Track real-time delivery status"    },
      { label: "Payment Received", key: "payment",  desc: "Confirm successful transactions"    },
      { label: "Refund Requests",  key: "refund",   desc: "Alerts on customer refund requests" },
    ],
  },
  {
    section: "System & Promotions",
    items: [
      { label: "System Maintenance", key: "system",  desc: "Scheduled downtime notices"  },
      { label: "Promotional Offers", key: "promo",   desc: "Platform campaigns & deals"  },
      { label: "Review & Ratings",   key: "reviews", desc: "New customer reviews posted" },
    ],
  },
];

function NotificationPrefsPage({ onBack }: { onBack: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [prefs,  setPrefs]  = useState<Record<string, { email: boolean; push: boolean; sms: boolean }>>(
    Object.fromEntries(
      NOTIF_GROUPS.flatMap(g => g.items).map(i => [i.key, { email: true, push: true, sms: false }])
    )
  );

  const toggle = (key: string, ch: "email" | "push" | "sms") =>
    setPrefs(p => ({ ...p, [key]: { ...p[key], [ch]: !p[key][ch] } }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SubHeader title="Notification Preferences" onBack={onBack} />
      <div className="space-y-6">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            {(["email", "push", "sms"] as const).map(ch => (
              <div key={ch} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{ch}</span>
              </div>
            ))}
          </div>
        </div>

        {NOTIF_GROUPS.map(group => (
          <div key={group.section} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/60 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">{group.section}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map(item => (
                <div key={item.key} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    {(["email", "push", "sms"] as const).map(ch => (
                      <div key={ch} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300 hidden lg:block">{ch}</span>
                        <Toggle on={prefs[item.key][ch]} onChange={() => toggle(item.key, ch)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <SaveBtn saving={saving} saved={saved} onClick={handleSave} label="Save Preferences" icon={Bell} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const MENU: { page: Page; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { page: "edit",            label: "Edit Profile",             desc: "Update your name, email & photo",  icon: User  },
  { page: "password",        label: "Change Password",          desc: "Update your login credentials",    icon: Lock  },
  { page: "delivery-timing", label: "Delivery Timing Settings", desc: "Set your hours, days & prep time", icon: Clock },
  { page: "notifications",   label: "Notification Preferences", desc: "Manage your alert preferences",    icon: Bell  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VendorSettings() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, initialized } = useSelector((s: RootState) => s.auth);
  const [page, setPage] = useState<Page>("main");

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  // ── Loading ──
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

  // ── Sub pages ──
  const subPages: Partial<Record<Page, React.ReactElement>> = {
    edit:              <EditProfilePage       onBack={() => setPage("main")} />,
    password:          <ChangePasswordPage    onBack={() => setPage("main")} />,
    "delivery-timing": <DeliveryTimingPage    onBack={() => setPage("main")} />,
    notifications:     <NotificationPrefsPage onBack={() => setPage("main")} />,
  };

  if (page !== "main" && subPages[page]) {
    return (
      <div className="min-h-screen bg-[#F7F6F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          {subPages[page]}
        </div>
      </div>
    );
  }

  // ── Main settings ──
  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your vendor account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Profile card ── */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="relative">
                <img src={avatarSrc} alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-100" />
                <button type="button" onClick={() => setPage("edit")}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-tight">{user.name}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-gray-300" />
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Phone className="w-3 h-3 text-gray-300" />
                    <p className="text-xs text-gray-400">{user.phone}</p>
                  </div>
                )}
              </div>
              {(user.role || user.department) && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {user.department && (
                    <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-100">
                      {user.department}
                    </span>
                  )}
                  {user.role && (
                    <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
                      {user.role}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Help card */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">Need Help?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Contact Partner Support</p>
                </div>
              </div>
              <button type="button"
                className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow shadow-orange-200/60">
                <MessageCircle className="w-4 h-4" /> CHAT
              </button>
            </div>
          </div>

          {/* ── RIGHT: Menu + logout ── */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account Settings</p>
              </div>
              {MENU.map(({ page: p, label, desc, icon: Icon }, idx) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-orange-50 transition-colors text-left group ${
                    idx < MENU.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p === "delivery-timing" && (
                      <span className="bg-orange-50 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-wide">
                        Soon
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
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