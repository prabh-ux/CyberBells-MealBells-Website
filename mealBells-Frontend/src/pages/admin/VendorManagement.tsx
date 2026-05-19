import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Edit, Trash2, Zap, Star,TrendingUp } from "lucide-react";

const vendorsData = [
  {
    id: 1,
    vendorId: "VLM-1921",
    name: "Urban Harvest Kitchen",
    email: "contact@urbanharvest.com",
    phone: "+1 (553) 012-5456",
    capacity: 850,
    rating: 4.8,
    reviews: 324,
    status: "ACTIVE",
    avatar: "UH",
    avatarColor: "#F59E0B",
  },
  {
    id: 2,
    vendorId: "VLM-4422",
    name: "Zen Sushi Bar",
    email: "order@zensushi.jp",
    phone: "+1 (555) 987-6545",
    capacity: 400,
    rating: 4.9,
    reviews: 233,
    status: "ACTIVE",
    avatar: "ZS",
    avatarColor: "#6366F1",
  },
  {
    id: 3,
    vendorId: "VLM-7719",
    name: "Rustic Crust Pizza",
    email: "hello@rusticpiz.za",
    phone: "+1 (555) 234-5678",
    capacity: 1200,
    rating: 4.2,
    reviews: 184,
    status: "INACTIVE",
    avatar: "RC",
    avatarColor: "#EC4899",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={14} className="fill-orange-400 text-orange-400" />
      <span className="text-sm font-semibold text-gray-900">{rating}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`text-[10px] sm:text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${
        isActive 
          ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
          : "bg-red-100 text-red-800 border-red-300"
      }`}
    >
      {status}
    </span>
  );
}

function Avatar({ initials, color }: { initials: string, color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border-2"
      style={{ 
        backgroundColor: color + "22", 
        borderColor: color + "44",
        color: color 
      }}
    >
      {initials}
    </div>
  );
}

export default function VendorManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [page, setPage] = useState(1);
  const [vendors] = useState(vendorsData);

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search);
    const matchStatus = statusFilter === "All Status" || v.status === statusFilter;
    const matchRating =
      ratingFilter === "All Ratings" ||
      (ratingFilter === "4.5+" && v.rating >= 4.5) ||
      (ratingFilter === "4.0+" && v.rating >= 4.0) ||
      (ratingFilter === "3.5+" && v.rating >= 3.5);
    return matchSearch && matchStatus && matchRating;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 tracking-tight leading-tight">Vendor Management</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage your restaurant partners, their capacities, and operational status.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/add-vendor")}
          className="w-full sm:w-auto bg-[#FF7A00] hover:bg-orange-600 transition-all text-white rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer min-w-[130px]"
              >
                <option>All Status</option>
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rating</span>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer min-w-[130px]"
              >
                <option>All Ratings</option>
                <option>4.5+</option>
                <option>4.0+</option>
                <option>3.5+</option>
              </select>
            </div>

            <button className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

    

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <Zap size={20} className="text-orange-500 fill-orange-500" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Vendors</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight">{vendors.length + 39}</div>
          <div className="text-xs text-gray-400 mt-2 font-medium">Registered restaurant partners</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">↑ +13.5%</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight">15.2k</div>
          <div className="text-xs text-gray-400 mt-2 font-medium">Daily combined meals capacity</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <Star size={20} className="text-orange-500 fill-orange-500" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Top Rated</span>
          </div>
          <div className="flex items-center gap-4">
            <Avatar initials="FB" color="#059669" />
            <div>
              <div className="font-bold text-gray-900 text-[15px]">Fresh Bowls Co.</div>
              <div className="text-xs text-emerald-600 font-bold">4.9 Avg User Rating</div>
            </div>
          </div>
        </div>
      </div>
        {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {["Vendor", "Contact Info", "Capacity", "Rating", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-orange-50/20 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar initials={vendor.avatar} color={vendor.avatarColor} />
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">{vendor.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-medium tracking-tight">ID: {vendor.vendorId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm text-gray-700 font-medium">{vendor.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-medium">{vendor.phone}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-orange-500 fill-orange-500" />
                      <span className="text-sm font-bold text-gray-900">{vendor.capacity.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tighter">meals</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <StarRating rating={vendor.rating} />
                    <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{vendor.reviews} reviews</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <StatusBadge status={vendor.status} />
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all hover:border-blue-200">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all hover:border-red-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500 font-bold">
            Showing {filtered.length} of 24 vendors
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:border-orange-500 transition-all active:scale-95"
            >
              ‹
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 border rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  page === p 
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20" 
                    : "border-gray-200 text-gray-500 hover:bg-white"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(3, page + 1))}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:border-orange-500 transition-all active:scale-95"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
