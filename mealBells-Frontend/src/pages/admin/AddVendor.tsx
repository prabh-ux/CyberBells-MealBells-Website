import  { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
 
  Save,
  Clock,
  List,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  CheckCircle,
} from "lucide-react";

const AddVendor = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    capacity: "",
    delivery: "",
    status: true,
    foodType: "Both",
    logo: null as string | null,
  });

  const set = (k: string, v: any) => setFormData((f) => ({ ...f, [k]: v }));

  const handleFile = (file: File) => {
    if (file) set("logo", URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => navigate("/admin/vendormanagement")}
              >
                Vendors
              </span>
              <span className="text-gray-300 text-xs">/</span>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Add New Vendor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Add New Food Vendor
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Onboard a new restaurant partner to the MealBells platform.
            </p>
          </div>

        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Vendor Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Vendor Name
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <User size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Gourmet Kitchens"
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Business Email
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <Mail size={18} className="text-gray-400 shrink-0" />
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <Phone size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Daily Meal Capacity
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <List size={18} className="text-gray-400 shrink-0" />
                <input
                  type="number"
                  placeholder="500"
                  value={formData.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Delivery Timing */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Delivery Timing
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <Clock size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM - 1:30 PM"
                  value={formData.delivery}
                  onChange={(e) => set("delivery", e.target.value)}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Vendor Status
              </label>
              <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">
                  Status:{" "}
                  <span className={`font-bold ${formData.status ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {formData.status ? 'Active' : 'Inactive'}
                  </span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => set("status", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Food Type Selection */}
          <div className="mt-8">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Food Type Selection
            </p>
            <div className="flex gap-3">
              {["Veg", "Non-Veg", "Both"].map((type) => (
                <button
                  key={type}
                  onClick={() => set("foodType", type)}
                  className={`px-6 py-2 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
                    formData.foodType === type
                      ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-500"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mt-10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Company Logo
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? "border-orange-500 bg-orange-50/50" : "border-gray-200 bg-gray-50 hover:bg-gray-100/50"
              }`}
            >
              {formData.logo ? (
                <div className="flex flex-col items-center">
                  <img src={formData.logo} alt="preview" className="max-h-24 rounded-lg object-contain mb-3" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); set("logo", null); }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remove and replace
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={24} className="text-orange-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 800×400px)</p>
                </>
              )}
              <input 
                ref={fileRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} 
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-12 border-t border-gray-100 pt-8">
            <button 
              onClick={() => navigate("/admin/vendormanagement")} 
              className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
            >
              Cancel
            </button>
            <button className="bg-[#FF7A00] hover:bg-orange-600 shadow-lg shadow-orange-500/20 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95">
              <Save size={18} />
              Save Vendor
              <CheckCircle size={16} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8">
          {[
            {
              icon: ShieldCheck,
              title: "Auto-Onboarding",
              desc: "New vendors receive credentials via email instantly.",
              bg: "bg-blue-50",
              iconBg: "bg-blue-100",
              color: "text-blue-600",
              titleColor: "text-blue-900",
            },
            {
              icon: CheckCircle,
              title: "Compliance Check",
              desc: "Documentation is stored in central server vault.",
              bg: "bg-emerald-50",
              iconBg: "bg-emerald-100",
              color: "text-emerald-600",
              titleColor: "text-emerald-900",
            },
            {
              icon: TrendingUp,
              title: "Priority Listing",
              desc: "High-capacity vendors get priority placement.",
              bg: "bg-orange-50",
              iconBg: "bg-orange-100",
              color: "text-orange-600",
              titleColor: "text-orange-900",
            },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} rounded-xl p-5 border border-white/50`}>
              <div className={`${item.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                <item.icon size={20} className={item.color} />
              </div>
              <h3 className={`font-bold text-sm mb-1.5 ${item.titleColor}`}>{item.title}</h3>
              <p className={`text-[11px] leading-relaxed ${item.color} opacity-80`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
  );
};

export default AddVendor;