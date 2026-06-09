import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorDishRequests, respondToVendorDishRequest } from "../../slices/dishRequestSlice";
import type { AppDispatch, RootState } from "../../app/store";
import type { VendorDishRequest } from "../../slices/dishRequestSlice";
import { Flame, Wind, Zap, CheckCircle2, XCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-gray-700", "bg-amber-800", "bg-orange-400",
  "bg-violet-500", "bg-sky-600", "bg-emerald-500",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DIET_MAP: Record<string, { label: string; cls: string }> = {
  Veg:       { label: "VEG",     cls: "text-green-600 bg-green-50" },
  "Non-Veg": { label: "NON-VEG", cls: "text-red-500 bg-red-50"    },
  Both:      { label: "BOTH",    cls: "text-amber-600 bg-amber-50" },
};

const SPICE_ICON: Record<string, React.ElementType> = {
  Mild: Wind, Normal: Flame, Spicy: Zap,
};

interface CardProps {
  item: VendorDishRequest;
  responding: string | null;
  onRespond: (id: string, action: "accepted" | "ignored") => void;
}

const RequestCard: React.FC<CardProps> = ({ item, responding, onRespond }) => {
  const { label: dietLabel, cls: dietCls } = DIET_MAP[item.dietaryPreference] ?? DIET_MAP["Both"];
  const SpiceIcon   = SPICE_ICON[item.spiceLevel] ?? Flame;
  const isResponding = responding === item._id;
  const name        = item.user?.name ?? "Unknown";

  return (
    <div className="flex flex-col gap-3">
      {/* User row */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-sm font-semibold overflow-hidden shrink-0`}>
          {item.user?.avatar ? (
            <img src={item.user.avatar} alt={name} className="w-full h-full object-cover" />
          ) : initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${dietCls}`}>
              {dietLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400">Requested {fmtDate(item.requestedDate)}</p>
        </div>
      </div>

      {/* Dish details */}
      <div>
        <h4 className="text-base font-bold text-gray-900 mb-0.5">
          {item.dishSuggestion || <span className="text-gray-400 font-normal italic">No specific dish mentioned</span>}
        </h4>
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <SpiceIcon size={12} className="text-gray-400" strokeWidth={2} />
          <p className="text-sm text-gray-500">{item.spiceLevel} spice level</p>
          {item.user?.department && (
            <>
              <span className="text-gray-200">·</span>
              <p className="text-sm text-gray-400">{item.user.department}</p>
            </>
          )}
        </div>

        {item.vendorStatus !== "pending" ? (
          <div className={`flex items-center gap-2 py-2.5 sm:py-3 px-4 rounded-2xl text-sm font-semibold ${
            item.vendorStatus === "accepted"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}>
            {item.vendorStatus === "accepted"
              ? <><CheckCircle2 size={16} strokeWidth={2} /> Accepted</>
              : <><XCircle size={16} strokeWidth={2} /> Ignored</>
            }
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <button
              onClick={() => onRespond(item._id, "accepted")}
              disabled={isResponding}
              className="flex-[3] py-3 sm:py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isResponding ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><CheckCircle2 size={14} strokeWidth={2.5} /> Accept</>
              )}
            </button>
            <button
              onClick={() => onRespond(item._id, "ignored")}
              disabled={isResponding}
              className="flex-1 py-3 sm:py-3.5 text-sm font-semibold text-black bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-lg transition-colors text-center"
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RequestedDishes: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vendorRequests, vendorLoading, vendorError, responding } = useSelector(
    (state: RootState) => state.dishRequests
  );
  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "ignored" | "all">("pending");

  useEffect(() => {
    dispatch(fetchVendorDishRequests({ status: statusFilter }));
  }, [dispatch, statusFilter]);

  const handleRespond = (id: string, action: "accepted" | "ignored") => {
    dispatch(respondToVendorDishRequest({ id, action }));
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto rounded-2xl shadow-sm p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Curated for you</h2>
            <p className="text-sm text-gray-500">Review and respond to employee meal requests.</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(["pending", "accepted", "ignored", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-orange-500 text-white border-orange-500"
                    : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
            <button
              onClick={() => dispatch(fetchVendorDishRequests({ status: statusFilter }))}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} className={vendorLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content */}
        {vendorLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                <div className="flex gap-3">
                  <div className="flex-[3] h-12 bg-gray-100 rounded-lg" />
                  <div className="flex-1 h-12 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : vendorError ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-500">{vendorError}</p>
          </div>
        ) : vendorRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Clock size={22} className="text-gray-300" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-400">
              No {statusFilter !== "all" ? statusFilter : ""} requests from admin yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-gray-100">
            {vendorRequests.map((item) => (
              <div key={item._id} className="pt-6 first:pt-0">
                <RequestCard item={item} responding={responding} onRespond={handleRespond} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestedDishes;