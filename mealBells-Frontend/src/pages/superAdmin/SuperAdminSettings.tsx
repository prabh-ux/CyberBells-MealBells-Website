import { useState, useEffect }         from "react";
import { useDispatch, useSelector }    from "react-redux";
import type { RootState, AppDispatch } from "../../app/store";
import {
  fetchSuperAdminSettings,
  updateSuperAdminSettings,
}                                      from "../../slices/superAdmin/superAdminSettingsSlice";
import type {
  PlatformDefaults,
  FeatureFlags,
  PlatformMeta,
}                                      from "../../slices/superAdmin/superAdminSettingsSlice";
import toast                           from "react-hot-toast";
import TimeDropdown, {
  type TimeValue,
  EMPTY_TIME,
}                                      from "../../components/shared/Timedropdown";
import {
  Building2,
  ToggleRight,
  BarChart2,
  RotateCcw,
  TriangleAlert,
}                                      from "lucide-react";

// ─── Time conversion helpers ──────────────────────────────────────────────────

function strToTimeValue(val: string): TimeValue {
  if (!val) return EMPTY_TIME;
  const [hStr, mStr] = val.split(":");
  const h24 = parseInt(hStr, 10);
  if (isNaN(h24)) return EMPTY_TIME;
  const p   = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h: String(h12), m: mStr ?? "00", p };
}

function timeValueToStr({ h, m, p }: TimeValue): string {
  if (!h || m === "" || !p) return "";
  let h24 = parseInt(h, 10) % 12;
  if (p === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({
  icon, iconBg, iconColor, title, description,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base sm:text-[15px] font-semibold text-gray-900 font-[var(--font-manrope)]">{title}</h2>
        <p className="text-[11px] sm:text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-orange-500" : "bg-gray-200"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">{children}</label>;
}

function NumberInput({
  value, onChange, min = 0, suffix,
}: {
  value: number; onChange: (v: number) => void; min?: number; suffix?: string;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => { setRaw(String(value)); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str);
    if (str !== "" && !isNaN(Number(str))) onChange(Number(str));
  };

  const handleBlur = () => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? min : Math.max(min, n);
    setRaw(String(clamped));
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-300">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        className="w-full bg-transparent text-sm text-gray-800 focus:outline-none"
      />
      {suffix && <span className="shrink-0 text-xs text-gray-400">{suffix}</span>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuperAdminSettings() {
  const dispatch = useDispatch<AppDispatch>();

  const { settings, loading, saving, error } = useSelector(
    (state: RootState) => state.superAdminSettings
  );

  const [defaults, setDefaults] = useState<PlatformDefaults>(settings.defaults);
  const [flags,    setFlags]    = useState<FeatureFlags>(settings.flags);
  const [meta,     setMeta]     = useState<PlatformMeta>(settings.meta);

  const [mealTime,   setMealTime]   = useState<TimeValue>(() => strToTimeValue(settings.defaults.defaultMealTime));
  const [cutoffTime, setCutoffTime] = useState<TimeValue>(() => strToTimeValue(settings.defaults.defaultCutoffTime));

  useEffect(() => { dispatch(fetchSuperAdminSettings()); }, [dispatch]);

  useEffect(() => {
    setDefaults(settings.defaults);
    setFlags(settings.flags);
    setMeta(settings.meta);
    setMealTime(strToTimeValue(settings.defaults.defaultMealTime));
    setCutoffTime(strToTimeValue(settings.defaults.defaultCutoffTime));
  }, [settings]);

  const handleMealTimeChange = (tv: TimeValue) => {
    setMealTime(tv);
    setDefaults((p) => ({ ...p, defaultMealTime: timeValueToStr(tv) }));
  };

  const handleCutoffTimeChange = (tv: TimeValue) => {
    setCutoffTime(tv);
    setDefaults((p) => ({ ...p, defaultCutoffTime: timeValueToStr(tv) }));
  };

  const handleSave = async () => {
    const result = await dispatch(updateSuperAdminSettings({ defaults, flags, meta }));
    if (updateSuperAdminSettings.fulfilled.match(result)) {
      toast.success("Platform settings saved!");
    } else {
      toast.error((result.payload as string) ?? "Save failed");
    }
  };

  const handleReset = () => {
    setDefaults(settings.defaults);
    setFlags(settings.flags);
    setMeta(settings.meta);
    setMealTime(strToTimeValue(settings.defaults.defaultMealTime));
    setCutoffTime(strToTimeValue(settings.defaults.defaultCutoffTime));
  };

  const BILLING_PLANS = [
    { value: "starter",    label: "Starter",    sub: "Up to 50 members" },
    { value: "pro",        label: "Pro",         sub: "Up to 500 members" },
    { value: "enterprise", label: "Enterprise",  sub: "Unlimited" },
  ] as const;

  const FLAG_ROWS: { key: keyof FeatureFlags; label: string; sub: string }[] = [
    { key: "vendorOnboarding",     label: "Vendor onboarding",       sub: "Allow new vendors to register on the platform" },
    { key: "selfServeOrgCreation", label: "Self-serve org creation",  sub: "Vendors can create organizations without approval" },
    { key: "emailNotifications",   label: "Email notifications",      sub: "Platform-wide transactional email delivery" },
    { key: "maintenanceMode",      label: "Maintenance mode",         sub: "Show a maintenance banner to all users" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8 font-[var(--font-inter)]">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[32px] font-[var(--font-manrope)] font-bold text-gray-900">
          Super admin settings
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Platform-level controls — these cascade to all vendors and organizations.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Platform overview (read-only) ── */}
          <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              icon={<BarChart2 size={20} />}
              iconBg="bg-green-100"
              iconColor="text-green-700"
              title="Platform overview"
              description="Live snapshot — read only."
            />
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <StatCard label="Vendors"       value={settings.stats.totalVendors} />
              <StatCard label="Organizations" value={settings.stats.totalOrgs} />
              <StatCard label="Members"       value={settings.stats.totalMembers} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Support email</FieldLabel>
                <input
                  type="email"
                  value={meta.supportEmail}
                  onChange={(e) => setMeta((p) => ({ ...p, supportEmail: e.target.value }))}
                  placeholder="support@yourplatform.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <FieldLabel>Platform version</FieldLabel>
                <input
                  type="text"
                  value={meta.platformVersion}
                  readOnly
                  className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-default focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ── New organization defaults ── */}
          <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              icon={<Building2 size={20} />}
              iconBg="bg-orange-100"
              iconColor="text-orange-500"
              title="New organization defaults"
              description="Applied when a vendor creates a new org. The org's own admin can override these."
            />

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Default meal time</FieldLabel>
                <TimeDropdown
                  value={mealTime}
                  onChange={handleMealTimeChange}
                  placeholder="Select meal time"
                />
              </div>
              <div>
                <FieldLabel>Default cutoff time</FieldLabel>
                <TimeDropdown
                  value={cutoffTime}
                  onChange={handleCutoffTimeChange}
                  placeholder="Select cutoff time"
                />
              </div>
            </div>

            <div className="mb-5">
              <FieldLabel>Default capacity (seats/day)</FieldLabel>
              <NumberInput
                value={defaults.defaultCapacity}
                onChange={(v) => setDefaults((p) => ({ ...p, defaultCapacity: v }))}
                suffix="seats"
              />
            </div>

            <div className="mb-5">
              <FieldLabel>Default billing plan</FieldLabel>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {BILLING_PLANS.map(({ value, label, sub }) => (
                  <button
                    key={value}
                    onClick={() => setDefaults((p) => ({ ...p, defaultBillingPlan: value }))}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      defaults.defaultBillingPlan === value
                        ? "border-orange-400 bg-orange-50 ring-1 ring-orange-300"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${defaults.defaultBillingPlan === value ? "text-orange-600" : "text-gray-700"}`}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Allow dish requests by default</p>
                <p className="text-xs text-gray-400">New orgs get this enabled unless their admin overrides it</p>
              </div>
              <Toggle
                enabled={defaults.defaultAllowDishRequests}
                onToggle={() => setDefaults((p) => ({ ...p, defaultAllowDishRequests: !p.defaultAllowDishRequests }))}
              />
            </div>
          </section>

          {/* ── Feature flags ── */}
          <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            <SectionHeader
              icon={<ToggleRight size={20} />}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              title="Feature flags"
              description="Enable or disable features globally — affects every vendor and organization instantly."
            />

            {flags.maintenanceMode && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Maintenance mode is active</p>
                  <p className="text-xs text-amber-600">All users are currently seeing a maintenance banner. Turn this off when done.</p>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {FLAG_ROWS.map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
                  </div>
                  <div className="ml-4 shrink-0 flex items-center gap-2">
                    <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      flags[key] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {flags[key] ? "On" : "Off"}
                    </span>
                    <Toggle
                      enabled={flags[key]}
                      onToggle={() => setFlags((p) => ({ ...p, [key]: !p[key] }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
          )}

          {/* Footer */}
          <div className="pt-1 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full rounded-2xl bg-orange-500 py-4 text-base font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save platform settings"}
            </button>
            <div className="flex items-center justify-center gap-1.5">
              <RotateCcw size={14} className="text-gray-400" />
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Discard changes
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}