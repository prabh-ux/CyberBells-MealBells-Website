import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Utensils, CalendarX, Bike,
  Star, Bell, CheckCheck, Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  type: "menu"| "absent" | "delivery" | "review";
  title: string;
  body: string;
  time: string;
  read: boolean;
  cta?: { label: string; action: string };
}

const INITIAL: Notification[] = [
  {
    id: "n1", type: "menu", read: false,
    title: "Today's menu is live!",
    body:  "Check out what's cooking for lunch and make your selection before 10 AM.",
    time:  "Just now",
    cta:   { label: "View Menu", action: "/menu-today" },
  },
  {
    id: "n2", type: "absent", read: false,
    title: "You marked absent yesterday",
    body:  "Your lunch preference was set to absent. We hope to see you back today!",
    time:  "Yesterday",
  },
  {
    id: "n3", type: "delivery", read: true,
    title: "Vendor delivered lunch at 12:15 PM",
    body:  "Your order from Green Bistro has arrived at the pickup station. Enjoy your meal!",
    time:  "2h ago",
  },
  {
    id: "n4", type: "review", read: true,
    title: "How was your lunch today?",
    body:  "Help us improve by rating your experience with the Grilled Salmon Bowl.",
    time:  "1h ago",
    cta:   { label: "Rate Now", action: "/review" },
  },
  {
    id: "n5", type: "menu", read: true,
    title: "Tomorrow's menu is ready",
    body:  "Dal Makhani with Jeera Rice is on the menu for tomorrow. Mark your attendance.",
    time:  "5h ago",
    cta:   { label: "Mark Attendance", action: "/menu-today" },
  },
  {
    id: "n6", type: "delivery", read: true,
    title: "Meal is out for delivery",
    body:  "Your Paneer Butter Masala is on its way and will arrive by 1:00 PM.",
    time:  "Yesterday",
  },
];

const TYPE_META: Record<Notification["type"], {
  icon: React.FC<{ className?: string }>;
  bg: string; color: string;
}> = {
  menu:     { icon: Utensils, bg: "bg-orange-50", color: "text-orange-500" },
  absent:   { icon: CalendarX, bg: "bg-red-50",   color: "text-red-400"   },
  delivery: { icon: Bike,      bg: "bg-blue-50",   color: "text-blue-500"  },
  review:   { icon: Star,      bg: "bg-yellow-50", color: "text-yellow-500"},
};

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>(INITIAL);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const remove = (id: string) =>
    setItems((prev) => prev.filter((n) => n.id !== id));

  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

        {/* ── Header ── */}
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
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Filter + summary ── */}
          <div className="space-y-5">

            {/* Filter toggle */}
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

            {/* Type breakdown */}
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">By Type</p>
              <div className="space-y-3">
                {(["menu", "delivery", "review", "absent"] as Notification["type"][]).map((type) => {
                  const meta  = TYPE_META[type];
                  const Icon  = meta.icon;
                  const count = items.filter((n) => n.type === type).length;
                  const label = type.charAt(0).toUpperCase() + type.slice(1);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 flex-1">{label}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty bell illustration when all read */}
            {unreadCount === 0 && (
              <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No unread notifications.</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Notification list ── */}
          <div className="lg:col-span-2">
            {visible.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center">
                <Bell className="w-12 h-12 text-gray-200" />
                <p className="text-gray-500 font-semibold">No notifications here</p>
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
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                              )}
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