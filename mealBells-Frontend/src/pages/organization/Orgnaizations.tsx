import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────────────────

type OrgStatus = "Active" | "Trial" | "Suspended";
type OrgPlan   = "Enterprise" | "Business" | "Starter";

interface Organization {
  id: string;
  name: string;
  adminName: string;
  adminEmail: string;
  status: OrgStatus;
  plan: OrgPlan;
  users: number;
  joinedAt: string;
}

// ── Mock data (replace with Redux slice / API call) ──────────────────────────

const MOCK_ORGS: Organization[] = [
  { id: "ORG-001", name: "Infosys Bangalore",    adminName: "Rohit Sharma",   adminEmail: "rohit@infosys.com",    status: "Active",    plan: "Enterprise", users: 340, joinedAt: "Jan 2024" },
  { id: "ORG-002", name: "Wipro Hyderabad",       adminName: "Priya Reddy",    adminEmail: "priya@wipro.com",      status: "Active",    plan: "Enterprise", users: 280, joinedAt: "Feb 2024" },
  { id: "ORG-003", name: "Zomato HQ",             adminName: "Arun Kapoor",    adminEmail: "arun@zomato.com",      status: "Trial",     plan: "Business",   users: 54,  joinedAt: "May 2024" },
  { id: "ORG-004", name: "Tata Consultancy",      adminName: "Meena Iyer",     adminEmail: "meena@tcs.com",        status: "Active",    plan: "Enterprise", users: 510, joinedAt: "Nov 2023" },
  { id: "ORG-005", name: "Freshworks",            adminName: "Suresh Rajan",   adminEmail: "suresh@freshworks.com",status: "Active",    plan: "Business",   users: 120, joinedAt: "Mar 2024" },
  { id: "ORG-006", name: "Byju's Learning",       adminName: "Vinod Nair",     adminEmail: "vinod@byjus.com",      status: "Suspended", plan: "Starter",    users: 30,  joinedAt: "Aug 2023" },
  { id: "ORG-007", name: "Razorpay",              adminName: "Kavya Mehta",    adminEmail: "kavya@razorpay.com",   status: "Trial",     plan: "Business",   users: 45,  joinedAt: "Jun 2024" },
  { id: "ORG-008", name: "Marico India",          adminName: "Deepak Joshi",   adminEmail: "deepak@marico.com",    status: "Active",    plan: "Starter",    users: 68,  joinedAt: "Apr 2024" },
  { id: "ORG-009", name: "Swiggy Operations",     adminName: "Anita Singh",    adminEmail: "anita@swiggy.in",      status: "Active",    plan: "Enterprise", users: 420, joinedAt: "Oct 2023" },
  { id: "ORG-010", name: "PhonePe Bangalore",     adminName: "Karan Bhatia",   adminEmail: "karan@phonepe.com",    status: "Active",    plan: "Business",   users: 95,  joinedAt: "Jan 2024" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrgStatus, { pill: string; dot: string }> = {
  Active:    { pill: "bg-[#EAF3DE] text-[#3B6D11]", dot: "bg-[#639922]" },
  Trial:     { pill: "bg-[#FAEEDA] text-[#854F0B]", dot: "bg-[#EF9F27]" },
  Suspended: { pill: "bg-[#FCEBEB] text-[#A32D2D]", dot: "bg-[#E24B4A]" },
};

const PLAN_STYLES: Record<OrgPlan, string> = {
  Enterprise: "bg-[#EEEDFE] text-[#534AB7] border-[#AFA9EC]",
  Business:   "bg-[#E6F1FB] text-[#185FA5] border-[#85B7EB]",
  Starter:    "bg-[#F1EFE8] text-[#5F5E5A] border-[#B4B2A9]",
};

/** Generate consistent initials + bg color from org name */
function getOrgAvatar(name: string): { initials: string; bg: string; color: string } {
  const palette = [
    { bg: "#E6F1FB", color: "#185FA5" },
    { bg: "#EAF3DE", color: "#3B6D11" },
    { bg: "#FAEEDA", color: "#854F0B" },
    { bg: "#EEEDFE", color: "#534AB7" },
    { bg: "#E1F5EE", color: "#0F6E56" },
    { bg: "#FBEAF0", color: "#993556" },
  ];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const idx = name.charCodeAt(0) % palette.length;
  return { initials, ...palette[idx] };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  badge,
  badgeStyle,
}: {
  label: string;
  value: number;
  badge: string;
  badgeStyle: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 mb-2">{value}</p>
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${badgeStyle}`}>
        {badge}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: OrgStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function PlanTag({ plan }: { plan: OrgPlan }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${PLAN_STYLES[plan]}`}>
      {plan}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Organizations() {
  const navigate = useNavigate();

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<OrgStatus | "All">("All");
  const [planFilter, setPlanFilter]   = useState<OrgPlan | "All">("All");
  const [sortBy, setSortBy]           = useState<"name" | "users" | "joinedAt">("joinedAt");

  // Derived stats
  const totalActive    = MOCK_ORGS.filter((o) => o.status === "Active").length;
  const totalTrial     = MOCK_ORGS.filter((o) => o.status === "Trial").length;
  const totalSuspended = MOCK_ORGS.filter((o) => o.status === "Suspended").length;

  // Filter + sort
  const filtered = useMemo(() => {
    return MOCK_ORGS.filter((o) => {
      const matchSearch =
        !search ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.adminName.toLowerCase().includes(search.toLowerCase()) ||
        o.adminEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      const matchPlan   = planFilter === "All" || o.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    }).sort((a, b) => {
      if (sortBy === "name")    return a.name.localeCompare(b.name);
      if (sortBy === "users")   return b.users - a.users;
      return 0; // joinedAt — keep insertion order (already chronological in mock)
    });
  }, [search, statusFilter, planFilter, sortBy]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All companies using MealBells · {MOCK_ORGS.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/super-admin/organizations/new")}
          className="flex items-center gap-2 bg-[#EA580C] hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200"
        >
          {/* Plus icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add organization
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          value={MOCK_ORGS.length}
          badge="+8 this month"
          badgeStyle="bg-[#EAF3DE] text-[#3B6D11]"
        />
        <StatCard
          label="Active"
          value={totalActive}
          badge={`${Math.round((totalActive / MOCK_ORGS.length) * 100)}% of total`}
          badgeStyle="bg-[#EAF3DE] text-[#3B6D11]"
        />
        <StatCard
          label="On trial"
          value={totalTrial}
          badge="Expiring soon"
          badgeStyle="bg-[#FAEEDA] text-[#854F0B]"
        />
        <StatCard
          label="Suspended"
          value={totalSuspended}
          badge="Needs review"
          badgeStyle="bg-[#FCEBEB] text-[#A32D2D]"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex-1 min-w-[180px] max-w-xs">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orgs, admins…"
            className="bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1.5">
          {(["All", "Active", "Trial", "Suspended"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                statusFilter === s
                  ? "bg-[#EA580C] text-white border-[#EA580C]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Plan select */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as OrgPlan | "All")}
          className="text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option value="All">All plans</option>
          <option value="Enterprise">Enterprise</option>
          <option value="Business">Business</option>
          <option value="Starter">Starter</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-50 transition-colors ml-auto"
        >
          <option value="joinedAt">Sort: Joined date</option>
          <option value="name">Sort: Name</option>
          <option value="users">Sort: Users</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Organization
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Users
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Admin
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <p className="text-gray-400 text-sm">No organizations match your filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                      setPlanFilter("All");
                    }}
                    className="mt-2 text-sm text-[#EA580C] hover:underline"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((org) => {
                const avatar = getOrgAvatar(org.name);
                return (
                  <tr
                    key={org.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors duration-100 cursor-pointer"
                    onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                  >
                    {/* Org name + ID */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: avatar.bg, color: avatar.color }}
                        >
                          {avatar.initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{org.name}</p>
                          <p className="text-[11px] text-gray-400">{org.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusPill status={org.status} />
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <PlanTag plan={org.plan} />
                    </td>

                    {/* Users */}
                    <td className="px-4 py-3.5 text-gray-600 font-medium">
                      {org.users.toLocaleString()}
                    </td>

                    {/* Admin */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-gray-700 text-sm">{org.adminName}</p>
                      <p className="text-gray-400 text-[11px]">{org.adminEmail}</p>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5 text-gray-400 text-sm hidden md:table-cell">
                      {org.joinedAt}
                    </td>

                    {/* Actions — stop row click propagation */}
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                          aria-label={`View ${org.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/super-admin/organizations/${org.id}/edit`)}
                          aria-label={`Edit ${org.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`More options for ${org.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {MOCK_ORGS.length} organizations
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "…", 15].map((p, i) => (
              <button
                key={i}
                type="button"
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-colors ${
                  p === 1
                    ? "bg-[#EA580C] text-white border-[#EA580C]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}