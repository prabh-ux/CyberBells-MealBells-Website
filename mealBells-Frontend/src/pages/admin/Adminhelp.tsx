import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  UserPlus,
  Store,
  BarChart2,
  UtensilsCrossed,
} from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I add a new user to the system?",
        a: "Go to Users → Add User from the sidebar. Fill in the user's name, email, department, and role, then click Create User. They'll receive an invite email to set their password.",
      },
      {
        q: "How do I register a new vendor?",
        a: "Navigate to Vendors → Add Vendor. Enter the vendor's business name, contact details, and assign a menu slot. The vendor will get login credentials via email.",
      },
      {
        q: "What's the difference between a user and a vendor account?",
        a: "Users are employees who order meals and view menus. Vendors are canteen/kitchen operators who manage dishes, update delivery status, and handle requested items.",
      },
    ],
  },
  {
    category: "Menu & Orders",
    items: [
      {
        q: "How do I publish today's menu?",
        a: "Open Menu Management and select today's date. Add or update dishes for each meal slot, then click Publish. Users will immediately see the updated menu in their panel.",
      },
      {
        q: "Can I edit a menu after it's been published?",
        a: "Yes. Open Menu Management, find the published menu, make your changes, and save. Changes are reflected in real time for users who haven't yet placed their preference.",
      },
      {
        q: "How are dish requests from users handled?",
        a: "User dish requests appear under Requested Dishes in both the admin and vendor panels. Admins can approve or reject requests; approved items can be added to a future menu.",
      },
    ],
  },
  {
    category: "Reports & Analytics",
    items: [
      {
        q: "Where can I see how much food was wasted this week?",
        a: "Go to Reports → Food Wastage Report. You can filter by date range, vendor, or meal type and export the data as a CSV.",
      },
      {
        q: "How is the consumption analytics report generated?",
        a: "The system aggregates daily order data and delivery confirmations. Head to Reports → Consumption Analytics, pick a date range, and the chart updates automatically.",
      },
      {
        q: "Can I see attendance trends over time?",
        a: "Yes. Attendance Summary under the Reports section shows daily and weekly attendance patterns. Hover over any bar to see the exact count for that day.",
      },
    ],
  },
  {
    category: "Account & Settings",
    items: [
      {
        q: "How do I change my password?",
        a: "Click your avatar in the top-right corner to open Profile Settings. Scroll to the Security section, enter your current password, then set a new one.",
      },
      {
        q: "How do I update the organisation's meal schedule?",
        a: "Go to Settings → Meal Schedule. You can configure meal times, enable or disable specific meal slots, and set cut-off times for orders.",
      },
      {
        q: "Who can access the Settings page?",
        a: "Only accounts with the Admin type can access Settings. Vendor and User accounts will be redirected to their own dashboards if they try to navigate there.",
      },
    ],
  },
];

const contactCards = [
  {
    icon: <Mail size={18} strokeWidth={1.8} />,
    label: "Email Support",
    value: "support@mealbells.com",
    sub: "Response within 24 hours",
    action: "mailto:support@mealbells.com",
  },
  {
    icon: <Phone size={18} strokeWidth={1.8} />,
    label: "Phone",
    value: "+91 98765 43210",
    sub: "Mon–Fri, 9 am–6 pm IST",
    action: "tel:+919876543210",
  },
  {
    icon: <MessageCircle size={18} strokeWidth={1.8} />,
    label: "Live Chat",
    value: "Start a conversation",
    sub: "Typically replies in minutes",
    action: "mailto:support@mealbells.com",
  },
];

export default function AdminHelp() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggle = (key: string) => setOpenIndex(prev => (prev === key ? null : key));

  const filtered = faqs.map(section => ({
    ...section,
    items: section.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div
      className="min-h-full px-4 py-6 sm:px-6 lg:px-10"
      style={{ backgroundColor: "var(--page-bg, #F9FAFB)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-orange-500 transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <HelpCircle size={20} strokeWidth={1.8} />
            </div>
            <h1
              className="text-xl font-semibold text-gray-800"
              style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}
            >
              Help & Support
            </h1>
          </div>
          <p className="text-[13px] text-gray-400 ml-12">
            Find answers, guides, and ways to get in touch.
          </p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 h-11 bg-white mb-6 focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <Search size={16} strokeWidth={1.8} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for answers..."
            className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Quick links */}
        {!search && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Add a user",       path: "/admin/add-user",         icon: <UserPlus size={15} strokeWidth={1.8} /> },
              { label: "Add a vendor",     path: "/admin/add-vendor",       icon: <Store size={15} strokeWidth={1.8} /> },
              { label: "View reports",     path: "/admin/reports",          icon: <BarChart2 size={15} strokeWidth={1.8} /> },
              { label: "Menu management",  path: "/admin/menu-management",  icon: <UtensilsCrossed size={15} strokeWidth={1.8} /> },
            ].map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 bg-white text-[12px] font-medium text-gray-600 hover:text-orange-500 hover:border-orange-200 transition-all text-left"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-orange-400">{link.icon}</span>
                  {link.label}
                </span>
                <ChevronRight size={14} className="shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        )}

        {/* FAQ sections */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-[13px]">
            No results for "<span className="text-gray-600">{search}</span>". Try different keywords.
          </div>
        ) : (
          <div className="space-y-6 mb-10">
            {filtered.map(section => (
              <div key={section.category}>
                <p className="text-[11px] font-medium tracking-[2px] uppercase text-gray-400 mb-3">
                  {section.category}
                </p>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                  {section.items.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openIndex === key;
                    return (
                      <div key={key} className={i > 0 ? "border-t border-gray-100" : ""}>
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-[13px] font-medium text-gray-700 leading-snug">{item.q}</span>
                          <ChevronDown
                            size={16}
                            strokeWidth={2}
                            className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 bg-white">
                            <p className="text-[13px] text-gray-500 leading-relaxed border-l-2 border-orange-200 pl-3">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact cards */}
        <div>
          <p className="text-[11px] font-medium tracking-[2px] uppercase text-gray-400 mb-3">
            Still need help?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contactCards.map(card => (
              <a
                key={card.label}
                href={card.action}
                className="flex flex-col gap-3 rounded-xl px-5 py-4 bg-white hover:border-orange-200 hover:shadow-sm transition-all"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-700">{card.label}</p>
                  <p className="text-[12px] text-orange-500 mt-0.5">{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-10">
          © 2026 MealBells Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}