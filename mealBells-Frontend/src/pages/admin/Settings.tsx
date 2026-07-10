import { useState, useEffect }         from "react";
import { useDispatch, useSelector }    from "react-redux";
import type { RootState, AppDispatch } from "../../app/store";
import { fetchOrganization, updateOrganization } from "../../slices/organizationSlice";
import type { OrgUpdatePayload }       from "../../slices/organizationSlice";
import axiosInstance                   from "../../app/axiosInstance";
import toast                           from "react-hot-toast";
import { Eye, EyeOff }                 from "lucide-react";

import alignJustifyIcon  from "../../assets/alignJustifyIcon.png";
import utensilsIcon      from "../../assets/utensilsIcon.png";
import bellIcon          from "../../assets/bellIconsettings.png";
import shieldIcon        from "../../assets/shieldIcon.png";
import clockIcon         from "../../assets/clock.png";
import timerIcon         from "../../assets/timerIcon.png";
import messageSquareIcon from "../../assets/messageSquareIcon.png";
import lockReset         from "../../assets/lockReset.png";
import refreshIcon       from "../../assets/refreshIcon.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = OrgUpdatePayload;

const FORM_DEFAULT: FormState = {
  companyName:       "",
  contactEmail:      "",
  officeAddress:     "",
  mealTime:          "12:30",
  cutoffTime:        "09:00",
  allowDishRequests: true,
    capacity:          0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const to12Hour = (val: string) => {
  const [hStr, mStr] = val.split(":");
  const h      = parseInt(hStr, 10);
  const m      = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${m} ${period}`;
};

// ─── Shared primitives ────────────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
      enabled ? "bg-orange-500" : "bg-gray-300"
    }`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
      enabled ? "translate-x-6" : "translate-x-1"
    }`} />
  </button>
);

const CircleCheckbox = ({ checked, onToggle }: { checked: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
      checked ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
    }`}
  >
    {checked && <span className="block h-2 w-1 -translate-y-px rotate-45 border-b-2 border-r-2 border-white" />}
  </button>
);

function SectionHeader({ icon, iconBg, title, description }: {
  icon: string; iconBg: string; title: string; description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-2 sm:gap-3">
      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${iconBg}`}>
        <img src={icon} alt={title} className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-[var(--font-manrope)]">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState("");
  const [show,            setShow]            = useState({
    current: false,
    next:    false,
    confirm: false,
  });

  const toggle = (k: keyof typeof show) =>
    setShow((s) => ({ ...s, [k]: !s[k] }));

  const handleSubmit = async () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.post("/auth/me/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg ?? "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const fields: {
    label:    string;
    value:    string;
    setter:   (v: string) => void;
    showKey:  keyof typeof show;
    placeholder: string;
  }[] = [
    {
      label:       "Current Password",
      value:       currentPassword,
      setter:      setCurrentPassword,
      showKey:     "current",
      placeholder: "••••••••",
    },
    {
      label:       "New Password",
      value:       newPassword,
      setter:      setNewPassword,
      showKey:     "next",
      placeholder: "Min. 6 characters",
    },
    {
      label:       "Confirm New Password",
      value:       confirmPassword,
      setter:      setConfirmPassword,
      showKey:     "confirm",
      placeholder: "••••••••",
    },
  ];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Change Password</h3>
        <p className="mb-5 text-xs text-gray-400">
          Enter your current password and choose a new one.
        </p>

        <div className="space-y-3">
          {fields.map(({ label, value, setter, showKey, placeholder }) => (
            <div key={showKey}>
              <label className="mb-1 block text-sm text-gray-600">{label}</label>
              <div className="relative">
                <input
                  type={show[showKey] ? "text" : "password"}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  onClick={() => toggle(showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show[showKey]
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();

  const { data: orgData, loading, saving, error } = useSelector(
    (state: RootState) => state.organization
  );

  const [form, setForm] = useState<FormState>(FORM_DEFAULT);

  // ── Local-only UI state
  const [emailAlerts,        setEmailAlerts]        = useState(true);
  const [mobilePush,         setMobilePush]         = useState(true);
  const [dailyVendor,        setDailyVendor]        = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // ── Fetch on mount
  useEffect(() => {
    dispatch(fetchOrganization());
  }, [dispatch]);

useEffect(() => {
  if (orgData) {
    setForm({
      companyName:       orgData.companyName      ?? "",
      contactEmail:      orgData.contactEmail      ?? "",
      officeAddress:     orgData.officeAddress     ?? "",
      mealTime:          orgData.mealTime          ?? "12:30",
      cutoffTime:        orgData.cutoffTime        ?? "09:00",
      allowDishRequests: orgData.allowDishRequests ?? true,
      capacity:          orgData.capacity          ?? 0,  
    });
  }
}, [orgData]);

  const handleSave = async () => {
    const result = await dispatch(updateOrganization(form));
    if (updateOrganization.fulfilled.match(result)) {
      toast.success("Settings saved!");
    } else {
      toast.error((result.payload as string) ?? "Save failed");
    }
  };

  const handleReset = () => setForm(FORM_DEFAULT);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8 font-[var(--font-inter)]">

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[32px] font-[var(--font-manrope)] font-bold text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Configure your MealBells enterprise environment and security preferences.
        </p>
      </div>

      <div className="space-y-4">

        {/* ── General ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={alignJustifyIcon}
            iconBg="bg-orange-100"
            title="General"
            description="Manage your core company identity and contact details."
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
            </div>
          ) : (
            <>
              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>
              )}
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-600">Office Address</label>
                <textarea
                  value={form.officeAddress}
                  onChange={(e) => setForm((p) => ({ ...p, officeAddress: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </>
          )}
        </section>

        {/* ── Meal Settings ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={utensilsIcon}
            iconBg="bg-blue-100"
            title="Meal Settings"
            description="Define default schedules and interaction rules for employee meals."
          />

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-gray-600">Default Meal Time</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-orange-300">
                <img src={clockIcon} alt="clock" className="h-4 w-4 opacity-40 shrink-0" />
                <input
                  type="time"
                  value={form.mealTime}
                  onChange={(e) => setForm((p) => ({ ...p, mealTime: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                />
                <span className="text-xs text-gray-400 shrink-0">{to12Hour(form.mealTime)}</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-600">Cut-off Time for Attendance</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-orange-300">
                <img src={timerIcon} alt="timer" className="h-4 w-4 opacity-40 shrink-0" />
                <input
                  type="time"
                  value={form.cutoffTime}
                  onChange={(e) => setForm((p) => ({ ...p, cutoffTime: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                />
                <span className="text-xs text-gray-400 shrink-0">{to12Hour(form.cutoffTime)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Users cannot change attendance after this time</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3 min-w-0">
              <img src={messageSquareIcon} alt="dish requests" className="mt-0.5 h-5 w-5 opacity-50 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">Allow Dish Requests</p>
                <p className="text-xs text-gray-500">Employees can suggest meals to the vendor</p>
              </div>
            </div>
            <div className="ml-4 shrink-0">
              <Toggle
                enabled={form.allowDishRequests}
                onToggle={() => setForm((p) => ({ ...p, allowDishRequests: !p.allowDishRequests }))}
              />
            </div>
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={bellIcon}
            iconBg="bg-indigo-100"
            title="Notifications"
            description="Control how and when administrators receive platform updates."
          />
          <div className="space-y-5">
            {[
              { checked: emailAlerts, toggle: () => setEmailAlerts((v) => !v), label: "Email Alerts",        sub: "Receive weekly billing and summary reports via email." },
              { checked: mobilePush,  toggle: () => setMobilePush((v) => !v),  label: "Mobile Push",         sub: "Real-time alerts for delivery and attendance milestones." },
              { checked: dailyVendor, toggle: () => setDailyVendor((v) => !v), label: "Daily Vendor Report", sub: "Direct synchronization with vendor dispatch systems." },
            ].map(({ checked, toggle, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <CircleCheckbox checked={checked} onToggle={toggle} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Security ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader
            icon={shieldIcon}
            iconBg="bg-red-100"
            title="Security"
            description="Manage access credentials and authentication."
          />
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center sm:justify-start cursor-pointer"
          >
            <img src={lockReset} alt="key" className="h-4 w-4 opacity-60 shrink-0" />
            Change Password
          </button>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-5 space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <img src={refreshIcon} alt="reset" className="h-3.5 w-3.5 opacity-50" />
          <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
            Reset to Default
          </button>
        </div>
      </div>

    </div>
  );
}