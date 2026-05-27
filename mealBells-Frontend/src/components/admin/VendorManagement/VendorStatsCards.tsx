import { Zap, TrendingUp, Star } from "lucide-react";
import VendorAvatar from "./VendorAvatar";
import type { Vendor } from "../../../types/admin";

interface Stats {
  activeCount: number;
  totalCapacity: number;
  topVendor: Vendor | null;
}

interface VendorStatsCardsProps {
  totalCount: number;
  stats: Stats;
}

export default function VendorStatsCards({ totalCount, stats }: VendorStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
      {/* Total Vendors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-50 p-2.5 rounded-xl">
            <Zap size={20} className="text-orange-500 fill-orange-500" />
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Vendors</span>
        </div>
        <div className="text-4xl font-bold text-gray-900 tracking-tight">{totalCount}</div>
        <div className="text-xs text-gray-400 mt-2 font-medium">
          {stats.activeCount} active · {totalCount - stats.activeCount} inactive
        </div>
      </div>

      {/* Total Capacity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Total Capacity</span>
        </div>
        <div className="text-4xl font-bold text-gray-900 tracking-tight">
          {stats.totalCapacity.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-2 font-medium">Daily combined meals capacity</div>
      </div>

      {/* Top Rated */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-50 p-2.5 rounded-xl">
            <Star size={20} className="text-orange-500 fill-orange-500" />
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Top Rated</span>
        </div>
        {stats.topVendor ? (
          <div className="flex items-center gap-4">
            <VendorAvatar name={stats.topVendor.name} logo={stats.topVendor.logo} />
            <div>
              <div className="font-bold text-gray-900 text-[15px]">{stats.topVendor.name}</div>
              <div className="text-xs text-emerald-600 font-bold">
                {stats.topVendor.rating.toFixed(1)} Avg User Rating
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No vendors yet</p>
        )}
      </div>
    </div>
  );
}