import { useState, useEffect }          from "react";
import { useDispatch, useSelector }     from "react-redux";
import type { RootState, AppDispatch }  from "../../app/store";
import { fetchOrganization, updateOrganization } from "../../slices/organizationSlice";
import toast from "react-hot-toast";

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
interface OrgFields {
  companyName:   string;
  contactEmail:  string;
  officeAddress: string;
}

const ORG_DEFAULT: OrgFields = {
  companyName:   "",
  contactEmail:  "",
  officeAddress: "",
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();

  // ── Redux state
  const { data: orgData, loading, saving, error } = useSelector(
    (state: RootState) => state.organization
  );

  // ── Local form state
  const [form, setForm] = useState<OrgFields>(ORG_DEFAULT);

  // ── Local UI state
  const [allowDishRequests, setAllowDishRequests] = useState(true);
  const [twoFactor,         setTwoFactor]         = useState(false);
  const [emailAlerts,       setEmailAlerts]       = useState(true);
  const [mobilePush,        setMobilePush]        = useState(true);
  const [dailyVendor,       setDailyVendor]       = useState(false);

  // ── Fetch org on mount
  useEffect(() => {
    dispatch(fetchOrganization());
  }, [dispatch]);

  // ── Sync Redux data → local form
  useEffect(() => {
    if (orgData) {
      setForm({
        companyName:   orgData.companyName,
        contactEmail:  orgData.contactEmail,
        officeAddress: orgData.officeAddress,
      });
    }
  }, [orgData]);

  // ── Save
  const handleSave = async () => {
    const result = await dispatch(updateOrganization(form));
    if (updateOrganization.fulfilled.match(result)) {
      toast.success("Settings saved!");
    } else {
      toast.error((result.payload as string) ?? "Save failed");
    }
  };

  // ── Reset
  const handleReset = () => setForm(ORG_DEFAULT);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8 font-[var(--font-inter)]">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[32px] font-[var(--font-manrope)] font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Configure your MealBells enterprise environment and security preferences.
        </p>
      </div>

      <div className="space-y-4">

        {/* ── General (Redux) ── */}
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

        {/* ── Meal Settings (local) ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader icon={utensilsIcon} iconBg="bg-blue-100" title="Meal Settings" description="Define default schedules and interaction rules for employee meals." />
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-gray-600">Default Meal Time</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <img src={clockIcon} alt="clock" className="h-4 w-4 opacity-40 shrink-0" />
                <span className="text-sm text-gray-800">12:30 PM</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-600">Cut-off Time for Attendance</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <img src={timerIcon} alt="timer" className="h-4 w-4 opacity-40 shrink-0" />
                <span className="text-sm text-gray-800">09:00 AM</span>
              </div>
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
              <Toggle enabled={allowDishRequests} onToggle={() => setAllowDishRequests((v) => !v)} />
            </div>
          </div>
        </section>

        {/* ── Notifications (local) ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader icon={bellIcon} iconBg="bg-indigo-100" title="Notifications" description="Control how and when administrators receive platform updates." />
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

        {/* ── Security (local) ── */}
        <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
          <SectionHeader icon={shieldIcon} iconBg="bg-red-100" title="Security" description="Manage access credentials and multi-factor authentication." />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full sm:w-auto justify-center sm:justify-start">
              <img src={lockReset} alt="key" className="h-4 w-4 opacity-60 shrink-0" />
              Change Password
            </button>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Two-Factor Auth (2FA)</p>
                <p className="text-xs text-gray-500">Extra layer of security</p>
              </div>
              <Toggle enabled={twoFactor} onToggle={() => setTwoFactor((v) => !v)} />
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-5 space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <img src={refreshIcon} alt="reset" className="h-3.5 w-3.5 opacity-50" />
          <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700">
            Reset to Default
          </button>
        </div>
      </div>

    </div>
  );
}