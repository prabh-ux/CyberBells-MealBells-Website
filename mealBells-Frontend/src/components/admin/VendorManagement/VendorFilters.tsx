import { Search, Filter } from "lucide-react";
import DropDown from "../../shared/DropDown";

interface VendorFiltersProps {
  search: string;
  statusFilter: string;
  ratingFilter: string;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onRatingChange: (val: string) => void;
}

const STATUS_OPTIONS = ["All Status", "ACTIVE", "INACTIVE"];
const RATING_OPTIONS = ["All Ratings", "4.5+", "4.0+", "3.5+"];

export default function VendorFilters({
  search,
  statusFilter,
  ratingFilter,
  onSearchChange,
  onStatusChange,
  onRatingChange,
}: VendorFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Dropdowns + Filter button */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
            <DropDown
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={onStatusChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rating</span>
            <DropDown
              value={ratingFilter}
              options={RATING_OPTIONS}
              onChange={onRatingChange}
            />
          </div>
          <button className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <Filter size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}