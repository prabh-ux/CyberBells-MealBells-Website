import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, UtensilsCrossed, Check, X, Users, Lock } from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTodayMenu, markAttendance } from "../../slices/userSlice";
import { fetchOrganization } from "../../slices/organizationSlice";

function InitialsAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-white bg-orange-100 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Users className="text-orange-400" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

/** Returns true if current local time is past the "HH:mm" cutoff string */
function isPastCutoff(cutoffTime: string): boolean {
  const now = new Date();
  const [hh, mm] = cutoffTime.split(":").map(Number);
  const cutoff = new Date();
  cutoff.setHours(hh, mm, 0, 0);
  return now > cutoff;
}

/** Formats "HH:mm" 24h → "9:00 AM" style */
function formatTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function TodayMenuPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { todayMenu: data, loadingToday: loading, voting } =
    useSelector((s: RootState) => s.user);

  const org = useSelector((s: RootState) => s.organization.data);

  useEffect(() => {
    dispatch(fetchTodayMenu());
    dispatch(fetchOrganization());
  }, [dispatch]);

  // Recompute every render (component re-renders on any state change; good enough)
  const cutoffPassed = useMemo(() => {
    if (!org?.cutoffTime) return false;
    return isPastCutoff(org.cutoffTime);
  }, [org?.cutoffTime]);

  const handleAttendance = (response: "yes" | "no") => {
    if (!data || voting || cutoffPassed) return;
    dispatch(markAttendance({ response, scheduleId: data.scheduleId }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] gap-4">
        <UtensilsCrossed className="w-16 h-16 text-gray-300" />
        <p className="text-gray-400 text-lg font-medium">No menu scheduled for today</p>
      </div>
    );
  }

  const { dish, colleaguesEating, colleagueAvatars, myResponse } = data;
  const visibleAvatars = colleagueAvatars.slice(0, 3);
  const overflowCount  = Math.max(0, colleaguesEating - visibleAvatars.length);

  return (
    <div className="min-h-screen p-8 lg:p-10 mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Today's Menu</h1>
      </div>

      <div className="flex flex-col gap-5">

        {/* Dish Card — unchanged */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                  dish.dishType === "Veg" ? "border-green-500" : "border-red-500"
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    dish.dishType === "Veg" ? "bg-green-500" : "bg-red-500"
                  }`} />
                </span>
                <span className={`text-sm font-semibold ${
                  dish.dishType === "Veg" ? "text-green-600" : "text-red-500"
                }`}>
                  {dish.dishType}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{dish.name}</h2>
              <p className="text-base text-gray-400 leading-relaxed line-clamp-2 mb-5">{dish.description}</p>

              <div className="flex items-center gap-3">
                {colleaguesEating > 0 ? (
                  <>
                    <div className="flex items-center">
                      {visibleAvatars.length > 0
                        ? visibleAvatars.map((src, i) => (
                            <div key={i} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden flex-shrink-0"
                              style={{ zIndex: 10 - i, marginLeft: i === 0 ? 0 : -10 }}>
                              <img src={src} alt="" className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                          ))
                        : <InitialsAvatar size={36} />
                      }
                      {overflowCount > 0 && (
                        <div className="w-9 h-9 rounded-full border-2 border-white bg-orange-50 flex items-center justify-center text-orange-500 text-xs font-bold flex-shrink-0"
                          style={{ marginLeft: visibleAvatars.length > 0 ? -10 : 0 }}>
                          +{overflowCount}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      <span className="font-semibold text-gray-600">{colleaguesEating}</span> colleagues are eating
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No colleagues eating yet</span>
                )}
              </div>
            </div>

            {dish.image ? (
              <div className="w-36 h-36 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl flex-shrink-0 bg-gray-100 flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* ── Attendance Card ── */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
          <p className="text-xl font-semibold text-gray-800 text-center mb-6">
            Are you eating today?
          </p>

          {cutoffPassed ? (
            /* ── CUTOFF PASSED STATE ── */
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-500">Attendance Closed</p>
              <p className="text-sm text-gray-400 text-center">
                The cutoff time was{" "}
                <span className="font-semibold text-gray-600">
                  {org?.cutoffTime ? formatTime(org.cutoffTime) : "—"}
                </span>
                . Attendance can no longer be changed for today.
              </p>
              {/* Still show what they previously responded */}
              {myResponse && (
                <div className={`mt-2 text-center text-sm font-semibold py-3 px-6 rounded-2xl flex items-center gap-2 ${
                  myResponse === "yes" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}>
                  {myResponse === "yes"
                    ? <><Check className="w-4 h-4 stroke-[3]" /> You marked: Eating today</>
                    : <><X className="w-4 h-4 stroke-[3]" /> You marked: Skipping today</>
                  }
                </div>
              )}
            </div>
          ) : (
            /* ── NORMAL VOTING STATE ── */
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* YES */}
                <button
                  disabled={voting}
                  onClick={() => handleAttendance("yes")}
                  className={`py-8 rounded-2xl font-bold text-xl transition-all duration-200 disabled:opacity-60 flex flex-col items-center justify-center gap-3 border-2 ${
                    myResponse === "yes"
                      ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 scale-[0.97]"
                      : myResponse === "no"
                      ? "bg-gray-100 border-gray-100 text-gray-300 cursor-pointer"
                      : "bg-green-500 border-green-500 text-white hover:bg-green-600 active:scale-[0.97] shadow-md shadow-green-200"
                  }`}
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    myResponse === "yes" ? "bg-white/30 ring-2 ring-white/60" : "bg-white/20"
                  }`}>
                    <Check className={`w-6 h-6 stroke-[3] ${myResponse === "no" ? "text-gray-300" : "text-white"}`} />
                  </span>
                  Yes
                </button>

                {/* NO */}
                <button
                  disabled={voting}
                  onClick={() => handleAttendance("no")}
                  className={`py-8 rounded-2xl font-bold text-xl transition-all duration-200 disabled:opacity-60 flex flex-col items-center justify-center gap-3 border-2 ${
                    myResponse === "no"
                      ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 scale-[0.97]"
                      : myResponse === "yes"
                      ? "bg-gray-100 border-gray-100 text-gray-300 cursor-pointer"
                      : "bg-red-500 border-red-500 text-white hover:bg-red-600 active:scale-[0.97] shadow-md shadow-red-200"
                  }`}
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    myResponse === "no" ? "bg-white/30 ring-2 ring-white/60" : "bg-white/20"
                  }`}>
                    <X className={`w-6 h-6 stroke-[3] ${myResponse === "yes" ? "text-gray-300" : "text-white"}`} />
                  </span>
                  No
                </button>
              </div>

              {myResponse && (
                <div className={`mt-5 text-center text-base font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 ${
                  myResponse === "yes" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}>
                  {myResponse === "yes"
                    ? <><Check className="w-5 h-5 stroke-[3]" /> You're in for today!</>
                    : <><X className="w-5 h-5 stroke-[3]" /> See you next time!</>
                  }
                </div>
              )}

              {/* Cutoff hint */}
              {org?.cutoffTime && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  Attendance closes at{" "}
                  <span className="font-semibold text-gray-500">{formatTime(org.cutoffTime)}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/user/weekly-menu-panel")}
            className="w-full bg-[#3d2314] hover:bg-[#4f2e1a] active:scale-[0.98] text-white py-5 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 shadow-md"
          >
            <CalendarDays className="w-5 h-5" />
            View Weekly Menu
          </button>

          {/* Only show Dish Request button if admin allows it */}
          {org?.allowDishRequests !== false && (
            <button className="w-full bg-white hover:bg-gray-50 active:scale-[0.98] border border-gray-200 text-gray-700 py-5 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5">
              <UtensilsCrossed className="w-5 h-5 text-gray-400" />
              Request Tomorrow's Menu
            </button>
          )}
        </div>

      </div>
    </div>
  );
}