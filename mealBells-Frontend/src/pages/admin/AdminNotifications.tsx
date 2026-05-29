import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Users, ShoppingBag, AlertTriangle,
  TrendingUp, Bell, CheckCheck, Trash2, Settings,
} from "lucide-react";

interface Notification {
  id: string;
  type: "order" | "user" | "alert" | "report";
  title: string;
  body: string;
  time: string;
  read: boolean;
  cta?: { label: string; action: string };
}

const INITIAL: Notification[] = [
  {
    id: "a1", type: "order", read: false,
    title: "New bulk order received",
    body: "TechCorp Pvt Ltd placed an order for 120 meals for tomorrow's lunch. Confirmation pending.",
    time: "Just now",
    cta: { label: "Review Order", action: "/admin/orders" },
  },
  {
    id: "a2", type: "alert", read: false,
    title: "Vendor delivery delayed",
    body: "Green Bistro has reported a 30-minute delay for today's lunch. Affected employees have been notified.",
    time: "15m ago",
    cta: { label: "View Details", action: "/admin/vendors" },
  },
  {
    id: "a3", type: "user", read: false,
    title: "5 new employees registered",
    body: "Anjali Sharma, Rohan Mehta and 3 others joined the MealBells platform and are pending meal plan assignment.",
    time: "1h ago",
    cta: { label: "Assign Plans", action: "/admin/employees" },
  },
  {
    id: "a4", type: "report", read: false,
    title: "Weekly analytics report ready",
    body: "Your meal delivery and attendance report for the week of May 19–25 is now available for download.",
    time: "2h ago",
    cta: { label: "View Report", action: "/admin/analytics" },
  },
  {
    id: "a5", type: "alert", read: true,
    title: "Low meal stock warning",
    body: "Paneer Butter Masala stock is running low. Only 12 servings remaining for today's service.",
    time: "3h ago",
  },
  {
    id: "a6", type: "order", read: true,
    title: "Order #1042 cancelled",
    body: "Infosys Block-B cancelled their order of 45 meals for tomorrow citing an internal event.",
    time: "5h ago",
    cta: { label: "See Order", action: "/admin/orders" },
  },
  {
    id: "a7", type: "user", read: true,
    title: "Employee preference updated",
    body: "Vikram Nair updated his dietary preference to vegetarian. Meal plan has been adjusted automatically.",
    time: "Yesterday",
  },
  {
    id: "a8", type: "report", read: true,
    title: "Monthly billing summary generated",
    body: "April 2025 billing summary has been generated. Total invoiced: ₹2,34,500 across 18 client accounts.",
    time: "Yesterday",
    cta: { label: "Download", action: "/admin/billing" },
  },
];

const TYPE_META: Record<Notification["type"], {
  icon: React.FC<{ className?: string }>;
  bg: string;
  color: string;
  label: string;
}> = {
  order:  { icon: ShoppingBag,    bg: "bg-orange-50",  color: "text-orange-500", label: "Orders"   },
  user:   { icon: Users,          bg: "bg-blue-50",    color: "text-blue-500",   label: "Users"    },
  alert:  { icon: AlertTriangle,  bg: "bg-red-50",     color: "text-red-400",    label: "Alerts"   },
  report: { icon: TrendingUp,     bg: "bg-green-50",   color: "text-green-500",  label: "Reports"  },
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>(INITIAL);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<Notification["type"] | "all">("all");

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const remove = (id: string) =>
    setItems((prev) => prev.filter((n) => n.id !== id));

  const visible = items
    .filter((n) => filter === "unread" ? !n.read : true)
    .filter((n) => typeFilter === "all" ? true : n.type === typeFilter);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT sidebar */}
          <div className="space-y-5">

            {/* Read filter toggle */}
            <div className="bg-white rounded-[20px] p-1.5 border border-gray-100 shadow-sm flex gap-1">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2.5 rounded-[16px] text-sm font-bold transition-all capitalize ${
                    filter === f
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {f === "all" ? `All (${items.length})` : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Filter by Type</p>
              <div className="space-y-2">

                {/* All option */}
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    typeFilter === "all"
                      ? "bg-orange-50 text-orange-600"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    typeFilter === "all" ? "bg-orange-100" : "bg-gray-100"
                  }`}>
                    <Bell className={`w-4 h-4 ${typeFilter === "all" ? "text-orange-500" : "text-gray-400"}`} />
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left">All</span>
                  <span className="text-sm font-bold">{items.length}</span>
                </button>

                {(["order", "user", "alert", "report"] as Notification["type"][]).map((type) => {
                  const meta  = TYPE_META[type];
                  const Icon  = meta.icon;
                  const count = items.filter((n) => n.type === type).length;
                  const active = typeFilter === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(active ? "all" : type)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        active ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <span className={`text-sm font-semibold flex-1 text-left ${active ? "text-orange-600" : "text-gray-600"}`}>
                        {meta.label}
                      </span>
                      <span className={`text-sm font-bold ${active ? "text-orange-600" : "text-gray-900"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* All caught up */}
            {unreadCount === 0 && (
              <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No unread notifications.</p>
              </div>
            )}
          </div>

          {/* RIGHT: list */}
          <div className="lg:col-span-2">
            {visible.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center">
                <Bell className="w-12 h-12 text-gray-200" />
                <p className="text-gray-500 font-semibold">No notifications here</p>
                <p className="text-xs text-gray-400">Try switching the filter above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((n) => {
                  const meta = TYPE_META[n.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      className={`bg-white rounded-[20px] border shadow-sm transition-all hover:shadow-md group ${
                        !n.read ? "border-orange-100" : "border-gray-100"
                      }`}
                    >
                      <div className="flex gap-4 p-5">

                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className={`text-sm font-bold leading-snug ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                              <span className="text-[11px] text-gray-400 whitespace-nowrap">{n.time}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>

                          {/* Actions */}
                          {(n.cta || !n.read) && (
                            <div className="flex items-center gap-3 mt-3">
                              {n.cta && (
                                <button
                                  type="button"
                                  onClick={() => { markRead(n.id); navigate(n.cta!.action); }}
                                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
                                >
                                  {n.cta.label}
                                </button>
                              )}
                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={() => markRead(n.id)}
                                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  Dismiss
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => remove(n.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}