import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { addUser, resetUserState } from "../../slices/adminSlice";
import {
  User, Mail, Phone, Save, Loader2, UploadCloud,
} from "lucide-react";
import DropDown from "../../components/shared/DropDown";
import { DEPARTMENTS, GENDER_OPTIONS } from "../../data/UserManagement";
import toast from "react-hot-toast";

// Fields that can have red-border error highlighting
type ErrorFields = Partial<Record<
  "fullName" | "email" | "phone" | "gender" | "department",
  string
>>;

const AddUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { adding, error } = useSelector((s: RootState) => s.admin);

  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [avatar,      setAvatar]      = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);

  // Per-field error state for red borders
  const [fieldErrors, setFieldErrors] = useState<ErrorFields>({});

  const [formData, setFormData] = useState({
    fullName:   "",
    email:      "",
    phone:      "",
    gender:     "",
    department: "",
    active:     true,
    role:       "Standard User",
  });

  // ── Derived: is form "complete enough" to enable Save button ───────────────
  // Required: fullName, email, gender, department
  const isFormReady = useMemo(() => {
    return (
      formData.fullName.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.gender.length > 0 &&
      formData.department.length > 0
    );
  }, [formData.fullName, formData.email, formData.gender, formData.department]);

  // Button is disabled if form is incomplete OR request is in flight
  const isSaveDisabled = !isFormReady || adding;

  // ── Clean up on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { dispatch(resetUserState()); };
  }, [dispatch]);

  // ── Show toast and navigate on success / error ─────────────────────────────
  const prevAdding = useRef(false);
  useEffect(() => {
    if (prevAdding.current && !adding) {
      if (!error) {
        toast.success("User created successfully!");
        setTimeout(() => navigate("/admin/users"), 1500);
      } else {
        toast.error(error);
      }
    }
    prevAdding.current = adding;
  }, [adding, error, navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearFieldError = (field: keyof ErrorFields) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    clearFieldError(name as keyof ErrorFields);
  };

  const handleDropdownChange = (field: keyof ErrorFields, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Validation + Save ──────────────────────────────────────────────────────
  const handleSave = () => {
    // Prevent double-submit if already in flight
    if (adding) return;

    const errors: ErrorFields = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone.trim() && !/^\+?[\d\s\-().]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = "Please enter a valid phone number";
    }

    if (!formData.gender) {
      errors.gender = "Please select a gender";
    }

    if (!formData.department) {
      errors.department = "Please select a department";
    }

    // If any errors, show all via toast and highlight fields
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Show the first error as a toast
      toast.error(Object.values(errors)[0]);
      return;
    }

    setFieldErrors({});

    const payload = new FormData();
    payload.append("fullName",   formData.fullName);
    payload.append("email",      formData.email);
    payload.append("phone",      formData.phone);
    payload.append("gender",     formData.gender);
    payload.append("department", formData.department);
    payload.append("role",       formData.role);
    payload.append("active",     String(formData.active));
    if (avatar) payload.append("avatar", avatar);

    dispatch(addUser(payload));
  };

  // ── Field border class helper ──────────────────────────────────────────────
  const fieldBorder = (field: keyof ErrorFields) =>
    fieldErrors[field]
      ? "border-red-400 bg-red-50 focus-within:border-red-500 focus-within:ring-red-500/10"
      : "border-gray-200 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500";

  const roles = [
    { title: "Standard User",   desc: "Access to standard features."   },
    { title: "Department Head", desc: "Manage team reporting."          },
    { title: "System Admin",    desc: "Full administrative access."     },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Add New User</h1>
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

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-8">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 self-start">
            Profile Avatar
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e)  => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={()  => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className={`relative w-28 h-28 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden
              ${dragOver
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/40"
              }`}
          >
            {preview ? (
              <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <UploadCloud size={24} />
                <span className="text-[10px] font-semibold text-center leading-tight px-2">
                  Upload Photo
                </span>
              </div>
            )}
            {preview && (
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadCloud size={20} className="text-white" />
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          {preview && (
            <button
              onClick={() => { setAvatar(null); setPreview(null); }}
              className="mt-3 text-xs text-red-500 font-bold hover:underline"
            >
              Remove photo
            </button>
          )}
          <p className="mt-2 text-[11px] text-gray-400">PNG, JPG or GIF · max 2MB</p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("fullName")}`}>
              <User size={18} className={fieldErrors.fullName ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input
                type="text" name="fullName" placeholder="e.g. John Doe"
                value={formData.fullName} onChange={handleChange}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
              />
            </div>
            {fieldErrors.fullName && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("email")}`}>
              <Mail size={18} className={fieldErrors.email ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input
                type="email" name="email" placeholder="john.doe@company.com"
                value={formData.email} onChange={handleChange}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Phone Number <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <div className={`flex items-center border rounded-xl px-4 h-12 transition-all ${fieldBorder("phone")}`}>
              <Phone size={18} className={fieldErrors.phone ? "text-red-400 shrink-0" : "text-gray-400 shrink-0"} />
              <input
                type="text" name="phone" placeholder="+1 (555) 000-0000"
                value={formData.phone} onChange={handleChange}
                className="w-full ml-3 outline-none text-sm bg-transparent text-gray-700"
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className={`h-12 flex items-stretch rounded-xl border transition-all ${
              fieldErrors.gender ? "border-red-400 bg-red-50" : "border-transparent"
            }`}>
              <DropDown
                wfull value={formData.gender} options={GENDER_OPTIONS}
                placeholder="Select Gender"
                onChange={(v) => handleDropdownChange("gender", v)}
              />
            </div>
            {fieldErrors.gender && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.gender}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Department <span className="text-red-400">*</span>
            </label>
            <div className={`h-12 flex items-stretch rounded-xl border transition-all ${
              fieldErrors.department ? "border-red-400 bg-red-50" : "border-transparent"
            }`}>
              <DropDown
                wfull value={formData.department} options={DEPARTMENTS}
                placeholder="Select Department"
                onChange={(v) => handleDropdownChange("department", v)}
              />
            </div>
            {fieldErrors.department && (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.department}</p>
            )}
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account Status</label>
            <div className="border border-gray-200 rounded-xl px-4 h-12 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                User Status:{" "}
                <span className={`font-bold ${formData.active ? "text-emerald-600" : "text-gray-400"}`}>
                  {formData.active ? "Active" : "Inactive"}
                </span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox" checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full transition-colors duration-200" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
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
                onClick={() => setFormData({ ...formData, role: role.title })}
                className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                  formData.role === role.title
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-gray-200 hover:border-orange-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    formData.role === role.title ? "border-orange-500" : "border-gray-300"
                  }`}>
                    {formData.role === role.title && (
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${formData.role === role.title ? "text-orange-900" : "text-gray-800"}`}>
                      {role.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{role.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Required fields note */}
        <p className="mt-6 text-xs text-gray-400">
          <span className="text-red-400">*</span> Required fields
        </p>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-8 border-t border-gray-100 pt-8">
          <button
            onClick={() => navigate("/admin/users")}
            disabled={adding}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all text-center disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Save — disabled if required fields empty OR request in flight */}
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            title={!isFormReady ? "Please fill in all required fields" : adding ? "Saving…" : ""}
            className={`bg-[#FF7A00] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all
              ${isSaveDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95"
              }`}
          >
            {adding ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={18} /> Save User</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddUser;