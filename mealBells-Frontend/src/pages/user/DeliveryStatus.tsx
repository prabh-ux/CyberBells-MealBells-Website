import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Bike,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  Utensils,
  RefreshCw,
} from "lucide-react";

interface TrackingStep {
  id: string;
  label: string;
  time: string | null;
  scheduledTime: string | null;
  status: "done" | "active" | "pending";
  icon: React.FC<{ className?: string }>;
}

const STEPS: TrackingStep[] = [
  {
    id: "preparing",
    label: "Preparing",
    time: "11:30 AM",
    scheduledTime: null,
    status: "done",
    icon: Utensils,
  },
  {
    id: "packed",
    label: "Packed",
    time: "11:45 AM",
    scheduledTime: null,
    status: "done",
    icon: Package,
  },
  {
    id: "delivery",
    label: "Out for Delivery",
    time: "12:05 PM",
    scheduledTime: null,
    status: "active",
    icon: Bike,
  },
  {
    id: "arrived",
    label: "Arrived at Office",
    time: null,
    scheduledTime: "12:20 PM",
    status: "pending",
    icon: MapPin,
  },
  {
    id: "pickup",
    label: "Ready for Pickup",
    time: null,
    scheduledTime: "12:30 PM",
    status: "pending",
    icon: ShoppingBag,
  },
];

export default function DeliveryStatus() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const activeStep = STEPS.find((s) => s.status === "active");
  const doneCount = STEPS.filter((s) => s.status === "done").length;
  const progress = (doneCount / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* ── Header ── */}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Delivery Status
            </h1>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── LEFT: ETA Card ── */}
          <div className="space-y-5">
            {/* ETA */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-5">
                <Bike className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Estimated Arrival
              </p>
              <p className="text-5xl font-bold text-gray-900 tracking-tight mb-4">
                12:30 PM
              </p>
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-bold px-4 py-1.5 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                On Schedule
              </span>
            </div>

            {/* Order info */}
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-orange-50 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80"
                    alt="dish"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    Zen Harvest Bowl
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Order #LM-8291</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors shrink-0"
                >
                  Details
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Progress
                </p>
                <p className="text-xs font-bold text-orange-500">
                  {doneCount} of {STEPS.length - 1} steps
                </p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Currently:{" "}
                <span className="font-semibold text-orange-500">
                  {activeStep?.label}
                </span>
              </p>
            </div>
          </div>

          {/* ── CENTER + RIGHT: Timeline ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
                Tracking Timeline
              </h2>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />

                <div className="space-y-0">
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isLast = idx === STEPS.length - 1;

                    return (
                      <div
                        key={step.id}
                        className="relative flex gap-6 pb-10 last:pb-0"
                      >
                        {/* Icon circle */}
                        <div className="relative z-10 shrink-0">
                          {step.status === "done" ? (
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          ) : step.status === "active" ? (
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-300 ring-4 ring-orange-100">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1.5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p
                                className={`font-bold text-sm ${
                                  step.status === "pending"
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p
                                className={`text-xs mt-0.5 ${
                                  step.status === "done"
                                    ? "text-orange-500 font-semibold"
                                    : step.status === "active"
                                      ? "text-orange-400 font-semibold"
                                      : "text-gray-400"
                                }`}
                              >
                                {step.time
                                  ? step.time
                                  : `Scheduled for ${step.scheduledTime}`}
                              </p>
                            </div>

                            {/* Active badge */}
                            {step.status === "active" && (
                              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>

                          {/* Delivery image for active step */}
                          {step.id === "delivery" && (
                            <div className="mt-4 rounded-2xl overflow-hidden h-40 w-72">
                              <img
                                src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80"
                                alt="delivery"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
