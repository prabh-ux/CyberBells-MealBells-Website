import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchUserDelivery } from "../../slices/deliverySlice";
import type { UserDeliveryStep } from "../../slices/deliverySlice";
import { fetchUserOrganization } from "../../slices/organizationSlice";
import { formatTime } from "../../utils/Timeformat";
import {
  Bike, CheckCircle2, MapPin, Package,
  ShoppingBag, Utensils, RefreshCw, Loader2,
} from "lucide-react";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Utensils, Package, Bike, MapPin, ShoppingBag,
};

const StepItem: React.FC<{ step: UserDeliveryStep }> = ({ step }) => {
  const Icon = ICON_MAP[step.icon] ?? Utensils;
  return (
    <div className="relative flex gap-4 sm:gap-6 pb-8 sm:pb-10 last:pb-0">
      <div className="relative z-10 shrink-0">
        {step.status === "done" ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        ) : step.status === "active" ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-300 ring-4 ring-orange-100">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 pt-1 sm:pt-1.5">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div>
            <p className={`font-bold text-sm ${step.status === "pending" ? "text-gray-400" : "text-gray-900"}`}>
              {step.label}
            </p>
            <p className={`text-xs mt-0.5 ${
              step.status === "done"    ? "text-orange-500 font-semibold"
              : step.status === "active" ? "text-orange-400 font-semibold"
              : "text-gray-400"
            }`}>
              {step.time ?? "Pending"}
            </p>
          </div>
          {step.status === "active" && (
            <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DeliveryStatus() {
  const dispatch = useDispatch<AppDispatch>();
  const { userDelivery, loadingUserDelivery, userDeliveryError } = useSelector((s: RootState) => s.delivery);
  const org = useSelector((s: RootState) => s.organization.data);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchUserDelivery());
    dispatch(fetchUserOrganization());
  }, [dispatch]);

  // Poll every 30s until delivery is completed
  useEffect(() => {
    if (userDelivery?.isCompleted) return;

    const interval = setInterval(() => {
      dispatch(fetchUserDelivery());
    }, 30_000);

    return () => clearInterval(interval);
  }, [dispatch, userDelivery?.isCompleted]);

  const doneCount  = userDelivery?.steps.filter((s) => s.status === "done").length ?? 0;
  const totalSteps = (userDelivery?.steps.length ?? 1) - 1;
  const progress   = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0;
  const activeStep = userDelivery?.steps.find((s) => s.status === "active");

  const hasLiveEta     = Boolean(userDelivery?.estimatedArrival);
  const displayEta     = hasLiveEta ? userDelivery!.estimatedArrival : org?.mealTime ? formatTime(org.mealTime) : "—";
  const etaIsScheduled = !hasLiveEta && Boolean(org?.mealTime);

  if (loadingUserDelivery && !userDelivery)
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

  if (userDeliveryError)
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-gray-500 font-medium mb-3">{userDeliveryError}</p>
          <button onClick={() => dispatch(fetchUserDelivery())} className="text-sm text-orange-500 underline">
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Delivery Status
          </h1>
          <button
            onClick={() => dispatch(fetchUserDelivery())}
            className="flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingUserDelivery ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {userDelivery && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

            <div className="space-y-4 sm:space-y-5">

              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <Bike className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Estimated Arrival
                </p>
                <p className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-1">
                  {displayEta}
                </p>
                {etaIsScheduled && (
                  <p className="text-xs text-gray-400 mb-3 sm:mb-4">Scheduled meal time</p>
                )}
                {!etaIsScheduled && <div className="mb-3 sm:mb-4" />}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full border ${
                  userDelivery.isCompleted
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-orange-50 text-orange-600 border-orange-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${userDelivery.isCompleted ? "bg-green-500" : "bg-orange-500 animate-pulse"}`} />
                  {userDelivery.isCompleted ? "Delivered" : "On the way"}
                </span>
              </div>

              {userDelivery.dish?.name && (
                <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden bg-orange-50 shrink-0">
                      {userDelivery.dish.image ? (
                        <img src={userDelivery.dish.image} alt={userDelivery.dish.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-orange-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{userDelivery.dish.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Today's meal</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Progress</p>
                  <p className="text-xs font-bold text-orange-500">{doneCount} of {totalSteps} steps</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                {activeStep && (
                  <p className="text-xs text-gray-400 mt-2">
                    Currently: <span className="font-semibold text-orange-500">{activeStep.label}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-5 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 sm:mb-8">
                  Tracking Timeline
                </h2>
                <div className="relative">
                  <div className="absolute left-[18px] sm:left-5 top-5 bottom-5 w-px bg-gray-100" />
                  <div className="space-y-0">
                    {userDelivery.steps.map((step) => (
                      <StepItem key={step.id} step={step} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}