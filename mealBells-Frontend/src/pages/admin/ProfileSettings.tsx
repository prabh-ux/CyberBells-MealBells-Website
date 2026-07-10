import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector }            from "react-redux";
import { useNavigate }                         from "react-router-dom";
import {
  User, Phone, Mail, Lock,
  Upload, CheckCircle, LogOut, ChevronDown, Camera,
} from "lucide-react";
import toast                                   from "react-hot-toast";
import { fetchMe, updateMe, logoutUser }       from "../../slices/authSlice";
import type { AppDispatch, RootState }         from "../../app/store";

const ROLES = [ "Super Admin", "System Admin","Department Head", "Vendor", "Standard User" ] as const;

const ProfileSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading, saving } = useSelector((s: RootState) => s.auth);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSystemAdmin = user?.role === "System Admin";

  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [role,      setRole]      = useState("");
  const [roleOpen,  setRoleOpen]  = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setName(user.name     ?? "");
    setPhone(user.phone   ?? "");
    setEmail(user.email   ?? "");
    setRole(user.role     ?? "Standard User");
    setAvatarUrl(user.avatar ?? "");
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {

    if (name && name.trim().length < 2) {
      toast.error("Name is too short.");
      return;
    }
    if (name && !/^[A-Za-z\s]+$/.test(name)) {
      toast.error("Name can only contain letters and spaces.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      toast.error("Phone number must be 10 digits.");
      return;
    }

    const fd = new FormData();
    fd.append("name",  name);
    fd.append("phone", phone);
    fd.append("email", email);
    fd.append("role",  role);
    if (imageFile) fd.append("avatar", imageFile);

    const res = await dispatch(updateMe(fd));
    if (updateMe.fulfilled.match(res)) {
      toast.success("Profile updated successfully!");
      setImageFile(null);
    } else {
      toast.error((res.payload as string) ?? "Update failed.");
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setName(user.name     ?? "");
    setPhone(user.phone   ?? "");
    setEmail(user.email   ?? "");
    setRole(user.role     ?? "Standard User");
    setAvatarUrl(user.avatar ?? "");
    setImageFile(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const inputCls = "w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FA7000]/20 focus:border-[#FA7000] transition";

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#FA7000] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-12 font-sans text-slate-800">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal information, role details, and platform preferences.
          </p>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200" />
                : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FFF4EC] flex items-center justify-center text-3xl font-bold text-[#FA7000]">
                    {name?.[0]?.toUpperCase()}
                  </div>
              }
              <div className="absolute -bottom-1 -right-1 bg-[#FA7000] p-1.5 rounded-lg text-white shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{name}</h2>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 mt-1">
                <Mail className="w-4 h-4 shrink-0" /><span>{email}</span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-[#FFF4EC] text-[#FA7000] border border-[#FFE3D1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FA7000]" />
            Verified {user?.type === "vendor" ? "Vendor" : "Admin"}
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Details */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <User className="w-4 h-4" /><h2>Personal Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={name} onChange={e => setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <Lock className="w-4 h-4" /><h2>Role & Permissions</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Current Role</label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <button
                    type="button"
                    onClick={() => isSystemAdmin && setRoleOpen(o => !o)}
                    className={`w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-left text-slate-700 focus:outline-none transition
                      ${isSystemAdmin
                        ? "cursor-pointer hover:border-[#FA7000] focus:ring-2 focus:ring-[#FA7000]/20 focus:border-[#FA7000]"
                        : "cursor-not-allowed opacity-60 bg-slate-50"
                      }`}
                  >
                    {role}
                  </button>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform pointer-events-none ${roleOpen && isSystemAdmin ? "rotate-180" : ""}`} />

                  {roleOpen && isSystemAdmin && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      {ROLES.map(r => {
                        const isLockedOption = r === "Super Admin" && user?.type !== "super_admin";
                        return (
                          <button
                            key={r} type="button"
                            disabled={isLockedOption}
                            onClick={() => { if (isLockedOption) return; setRole(r); setRoleOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2
                              ${isLockedOption
                                ? "text-slate-300 cursor-not-allowed"
                                : role === r
                                  ? "bg-[#FFF4EC] text-[#FA7000] font-semibold"
                                  : "text-slate-700 hover:bg-[#FFF4EC] hover:text-[#FA7000]"
                              }`}
                          >
                            <span>{r}</span>
                            {isLockedOption && <Lock className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!isSystemAdmin && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Only a System Admin can change role assignments.
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                  {isSystemAdmin
                    ? <><strong className="text-slate-800">System Admin:</strong> You have full access including role management for all users.</>
                    : <><strong className="text-slate-800">Role locked:</strong> You currently have full access to menu configuration and financial reports. Role changes require a System Admin.</>
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">

            {/* Imagery */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <User className="w-4 h-4" /><h2>Imagery</h2>
              </div>
              <input
                type="file" ref={fileInputRef} className="hidden"
                accept="image/*" onChange={handleImageChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#FFE3D1] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition-colors group h-32 sm:h-40"
              >
                <div className="bg-slate-50 p-2.5 rounded-full text-slate-400 group-hover:text-[#FA7000] group-hover:bg-[#FFF4EC] transition-colors mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Change Picture</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[150px]">SVG, PNG, JPG or GIF (max. 800×800px)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col gap-3">
              <button
                onClick={handleSave} disabled={saving}
                className="w-full bg-[#FA7000] text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-[#E06400] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : <><CheckCircle className="w-4 h-4" /> Save Changes</>
                }
              </button>
              <button
                onClick={handleCancel} disabled={saving}
                className="w-full bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-200 transition disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <hr className="border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-rose-600 font-medium text-sm py-2 hover:text-rose-700 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;