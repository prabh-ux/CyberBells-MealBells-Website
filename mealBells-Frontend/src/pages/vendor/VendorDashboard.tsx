import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorDashboard } from "../../slices/vendorSlice";
import type { AppDispatch, RootState } from "../../app/store";
import {
  UtensilsCrossed,
  Truck,
  Star,
  BarChart3,
} from "lucide-react";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

export default function VendorDashboard() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
 const { dashboard, dashboardLoading, error, activeOrgId } = useSelector((s: RootState) => s.vendors);

useEffect(() => {
  if (activeOrgId) dispatch(fetchVendorDashboard({ orgId: activeOrgId }));
}, [dispatch, activeOrgId]); 

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">

      {/* ── Title ── */}
      <div>
        <p className="text-md font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Morning Overview
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-md text-black mb-3">Today's Orders</p>
          {dashboardLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-bold text-[#7B3F00]">{dashboard?.todayOrders ?? 0}</p>
          )}
        </div>

        {/* Pending Delivery */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-md text-black mb-3">Pending Delivery</p>
          {dashboardLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-bold text-[#EA580C]">{dashboard?.pendingDelivery ?? 0}</p>
          )}
        </div>

        {/* Reviews Today */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-md text-black mb-3">Reviews Today</p>
          {dashboardLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-3xl font-bold text-black">
                {dashboard?.reviewsToday.avg ?? 0}
              </span>
              <span className="text-md text-gray-700 mt-1">
                ({dashboard?.reviewsToday.count ?? 0})
              </span>
            </div>
          )}
        </div>

        {/* Meals This Week */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-md text-black mb-3">Meals This Week</p>
          {dashboardLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-bold text-black">{dashboard?.mealsThisWeek ?? 0}</p>
          )}
        </div>
      </div>

      {/* ── Attendance Summary ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Attendance Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-2xl p-5">
            <p className="text-md  text-[#EA580C] mb-2">Present Users</p>
            {dashboardLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-bold text-black">{dashboard?.attendance.present ?? 0}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-md text-black mb-2">Absent Users</p>
            {dashboardLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-bold text-black">{dashboard?.attendance.absent ?? 0}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex flex-col gap-2.5">

          <button
            onClick={() => navigate("/vendor/menu")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-[#7B3F00] text-white font-semibold text-sm hover:bg-[#6a3500] transition-colors shadow-sm group"
          >
            <span>View Today's Menu</span>
            <UtensilsCrossed className="w-4 h-4 text-orange-300 group-hover:scale-110 transition-transform duration-200" />
          </button>

          <button
            onClick={() => navigate("/vendor/delivery")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-700 hover:bg-[#7B3F00] hover:border-[#7B3F00] hover:text-white transition-colors group"
          >
            <span>Update Delivery Status</span>
            <Truck className="w-4 h-4 text-black group-hover:text-orange-300 group-hover:scale-110 transition-all duration-200" />
          </button>

          <button
            onClick={() => navigate("/vendor/reviews")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-700 hover:bg-[#7B3F00] hover:border-[#7B3F00] hover:text-white transition-colors group"
          >
            <span>Check Reviews</span>
            <Star className="w-4 h-4 text-black group-hover:text-orange-300 group-hover:scale-110 transition-all duration-200" />
          </button>

          <button
            onClick={() => navigate("/vendor/reports")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-700 hover:bg-[#7B3F00] hover:border-[#7B3F00] hover:text-white transition-colors group"
          >
            <span>View Reports</span>
            <BarChart3 className="w-4 h-4 text-black group-hover:text-orange-300 group-hover:scale-110 transition-all duration-200" />
          </button>

        </div>
      </div>

    </div>
  );
}