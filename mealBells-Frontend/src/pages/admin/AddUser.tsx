import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  ChevronDown,
  Save,
} from "lucide-react";

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    department: "",
    active: true,
    role: "Standard User",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const roles = [
    {
      title: "Standard User",
      desc: "Access to standard features.",
    },
    {
      title: "Department Head",
      desc: "Manage team reporting.",
    },
    {
      title: "System Admin",
      desc: "Full administrative access.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Add New User
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Create a new team member and assign their initial department.
            </p>
          </div>

          <button 
            onClick={() => navigate("/admin/users")} 
            className="flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            <span className="mr-1.5">←</span> Back to List
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 shadow-sm">
          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Full Name
              </label>

              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <User size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Email Address
              </label>

              <div className="flex items-center border border-gray-200 rounded-xl px-4 h-12 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500 transition-all">
                <Mail size={18} className="text-gray-400 shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Gender
              </label>

              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 h-12 appearance-none outline-none text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer text-gray-700"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>

                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Department
              </label>

              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 h-12 appearance-none outline-none text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer text-gray-700"
                >
                  <option value="">Select Department</option>
                  <option>Development</option>
                  <option>HR</option>
                  <option>Marketing</option>
                </select>

                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Account Status
              </label>

              <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">
                  User Status:{" "}
                  <span className={`font-bold ${formData.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {formData.active ? 'Active' : 'Inactive'}
                  </span>
                </span>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        active: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />

                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200"></div>

                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mt-10">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Initial Role Assignment
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div
                  key={role.title}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      role: role.title,
                    })
                  }
                  className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                    formData.role === role.title
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-gray-200 hover:border-orange-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                        formData.role === role.title
                          ? "border-orange-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.role === role.title && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>

                    <div>
                      <h3 className={`font-bold text-sm ${formData.role === role.title ? 'text-orange-900' : 'text-gray-800'}`}>
                        {role.title}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-12 border-t border-gray-100 pt-8">
            <button 
              onClick={() => navigate("/admin/users")} 
              className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
            >
              Cancel
            </button>

            <button className="bg-[#FF7A00] hover:bg-orange-600 shadow-lg shadow-orange-500/20 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95">
              <Save size={18} />
              Save User
            </button>
          </div>
        </div>
      </div>
  );
};

export default AddUser;