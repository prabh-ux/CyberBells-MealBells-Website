import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTodayDelivery, advanceDelivery } from "../../slices/deliverySlice";
import type { DeliveryStep } from "../../slices/deliverySlice";
import { Check, Clock, RefreshCw, Loader2, AlertTriangle, Timer, CalendarX } from "lucide-react";

function parseTimeString(timeStr: string): Date | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours   = parseInt(match[1], 10);
  const mins  = parseInt(match[2], 10);
  const ampm  = match[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours  = 0;

  const d = new Date();
  d.setHours(hours, mins, 0, 0);
  return d;
}

function parseDeliveryWindow(timing: string | undefined | null): {
  start: Date; end: Date; label: string;
} | null {
  if (!timing) return null;
  const parts = timing.split("-").map(s => s.trim());
  if (parts.length < 2) return null;
  const start = parseTimeString(parts[0]);
  const end   = parseTimeString(parts[1]);
  if (!start || !end) return null;
  return { start, end, label: timing };
}

function useWindowStatus(window: { start: Date; end: Date } | null) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!window) return { closed: false, notStarted: false, countdown: null };

  const closed     = now > window.end;
  const notStarted = now < window.start;

  const diffMs   = closed
    ? now.getTime() - window.end.getTime()
    : window.end.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const hours    = Math.floor(diffMins / 60);
  const mins     = diffMins % 60;

  const countdown = closed
    ? `Window closed ${hours > 0 ? `${hours}h ` : ""}${mins}m ago`
    : notStarted
    ? `Opens in ${hours > 0 ? `${hours}h ` : ""}${mins}m`
    : `${hours > 0 ? `${hours}h ` : ""}${mins}m remaining`;

  return { closed, notStarted, countdown };
}

function isNoDeliveryError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("no dish") ||
    lower.includes("no delivery") ||
    lower.includes("not scheduled") ||
    lower.includes("scheduled for today") ||
    lower.includes("no order")
  );
}

const StepItem: React.FC<{ step: DeliveryStep; isLast: boolean }> = ({ step, isLast }) => (
  <div className="flex items-start gap-4 relative">
    {!isLast && (
      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100" />
    )}
    <div className={[
      "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
      step.status === "completed" ? "bg-orange-500"                        : "",
      step.status === "current"   ? "bg-orange-500 ring-4 ring-orange-100 animate-pulse" : "",
      step.status === "pending"   ? "bg-white border-2 border-gray-200"    : "",
    ].join(" ")}>
      {(step.status === "completed" || step.status === "current") && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
    </div>
    <div className="pt-1 pb-6">
      <p className={`text-sm font-semibold ${
        step.status === "current"   ? "text-orange-500" :
        step.status === "completed" ? "text-gray-700"   : "text-gray-400"
      }`}>
        {step.label}
      </p>
      {step.subtitle && (
        <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>
      )}
    </div>
  </div>
);

// ── Empty state (no delivery scheduled) ──────────────────────────────────────

const NoDeliveryState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <div className="px-6 py-14 flex flex-col items-center text-center gap-4">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
      <CalendarX className="w-7 h-7 text-gray-300" />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-600">No delivery scheduled today</p>
      <p className="text-xs text-gray-400 mt-1 max-w-[220px] leading-relaxed">
        Once a delivery is assigned for today, live progress will appear here.
      </p>
    </div>
    <button
      onClick={onRefresh}
      className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors mt-1"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Refresh
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const DeliveryStatusVendor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { delivery, loading, saving, error } = useSelector((s: RootState) => s.delivery);
  const { user }        = useSelector((s: RootState) => s.auth);
  const { activeOrgId } = useSelector((s: RootState) => s.vendors);

  const deliveryWindow = parseDeliveryWindow((user as any)?.deliveryTiming);
  const { closed, notStarted, countdown } = useWindowStatus(deliveryWindow);

  const handleRefresh = () => {
    if (activeOrgId) dispatch(fetchTodayDelivery(activeOrgId));
  };

  useEffect(() => {
    if (activeOrgId) dispatch(fetchTodayDelivery(activeOrgId));
  }, [dispatch, activeOrgId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    // "No dish scheduled" is not a real error — render the full page with empty state
    if (isNoDeliveryError(error)) {
      return (
        <div className="min-h-screen bg-[#F7F6F3] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Status</h1>
              <p className="text-sm text-gray-400 mt-1">Manage today's delivery progress</p>
            </div>
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Progress</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">Today's Order</p>
              </div>
              <NoDeliveryState onRefresh={handleRefresh} />
            </div>
          </div>
        </div>
      );
    }

    // Genuine error
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] p-8 text-center shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Could not load delivery</p>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getWindowBadge = () => {
    if (!deliveryWindow) return null;
    if (closed)     return { color: "bg-red-100 text-red-600",     text: "Window Closed"   };
    if (notStarted) return { color: "bg-blue-100 text-blue-600",   text: "Not Started Yet" };
    return                  { color: "bg-green-100 text-green-600", text: "Window Open"    };
  };
  const badge = getWindowBadge();

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F6F3] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Status</h1>
          <p className="text-sm text-gray-400 mt-1">Manage today's delivery progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT: Timing info */}
          <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Delivery Window</p>

              {deliveryWindow ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{deliveryWindow.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Today's window</p>
                    </div>
                  </div>

                  {badge && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${badge.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {badge.text}
                    </span>
                  )}

                  {countdown && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl">
                      <Timer className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs font-semibold text-gray-600">{countdown}</span>
                    </div>
                  )}

                  {closed && (
                    <div className="flex gap-2.5 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-700 leading-relaxed font-medium">
                        The delivery window has passed. You can still update the delivery status.
                      </p>
                    </div>
                  )}

                  {notStarted && (
                    <div className="flex gap-2.5 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Delivery window hasn't started yet. Updates will be enabled at{" "}
                        {deliveryWindow.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2.5 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 leading-relaxed font-medium">
                    No delivery timing set on your profile. Contact admin to configure.
                  </p>
                </div>
              )}
            </div>

            {delivery && (
              <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Current Status</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wide ${
                    delivery.isCompleted ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {delivery.isCompleted ? "✓ Delivered" : delivery.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {delivery.steps.filter(s => s.status === "completed" || s.status === "current").length} of {delivery.steps.length} steps completed
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(delivery.steps.filter(s => s.status === "completed" || s.status === "current").length / delivery.steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Steps + button */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Progress</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">Today's Order</p>
                </div>
                {delivery && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                    delivery.isCompleted ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {delivery.isCompleted ? "Delivered" : "In Progress"}
                  </span>
                )}
              </div>

              {delivery ? (
                <div className="px-6 pt-6 pb-2">
                  {delivery.steps.map((step, idx) => (
                    <StepItem
                      key={step.key}
                      step={step}
                      isLast={idx === delivery.steps.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <NoDeliveryState onRefresh={handleRefresh} />
              )}

              <div className="px-6 pb-6">
                {delivery?.isCompleted ? (
                  <div className="w-full py-3.5 bg-green-50 border border-green-200 text-green-600 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                    <Check className="w-4 h-4" strokeWidth={3} /> Delivery Complete
                  </div>
                ) : delivery?.canAdvance ? (
                  <button
                    onClick={() => activeOrgId && dispatch(advanceDelivery({ deliveryId: delivery._id, orgId: activeOrgId }))}
                    disabled={saving}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 text-sm"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                      : <><RefreshCw className="w-4 h-4" /> Update Status</>
                    }
                  </button>
                ) : null}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryStatusVendor;