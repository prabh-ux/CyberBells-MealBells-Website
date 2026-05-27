import { Zap } from "lucide-react";
import VendorAvatar from "./VendorAvatar";
import StarRating from "./StarRating";
import StatusBadge from "./StatusBadge";
import editIcon     from "../../../assets/editIcon.png";
import activeIcon   from "../../../assets/activeIcon.png";
import inactiveIcon from "../../../assets/inactiveIcon.png";
import type { Vendor } from "../../../types/admin";

interface VendorTableProps {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
  onToggleStatus: (id: string) => void;
}

const TABLE_HEADERS = ["Vendor", "Contact Info", "Capacity", "Rating", "Status", "Actions"];

export default function VendorTable({ vendors, onEdit, onToggleStatus }: VendorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {vendors.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                No vendors found.
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => (
              <tr key={vendor._id} className="hover:bg-orange-50/20 transition-colors group">
                {/* Vendor */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <VendorAvatar name={vendor.name} logo={vendor.logo} />
                    <div>
                      <div className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                        {vendor.name}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-medium">
                        ID: {vendor.vendorId}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-700 font-medium">{vendor.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{vendor.phone}</div>
                </td>

                {/* Capacity */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-orange-500 fill-orange-500" />
                    <span className="text-sm font-bold text-gray-900">
                      {vendor.capacity.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-tighter">meals</span>
                  </div>
                </td>

                {/* Rating */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <StarRating rating={vendor.rating} />
                  <div className="text-[10px] text-gray-400 mt-0.5">{vendor.totalReviews} reviews</div>
                </td>

                {/* Status */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <StatusBadge status={vendor.status} />
                </td>

                {/* Actions */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(vendor)}
                      className="p-2 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                      title="Edit vendor"
                    >
                      <img src={editIcon} alt="Edit" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(vendor._id)}
                      className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                      title={vendor.status ? "Deactivate vendor" : "Activate vendor"}
                    >
                      <img
                        src={vendor.status ? activeIcon : inactiveIcon}
                        alt={vendor.status ? "Active" : "Inactive"}
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}