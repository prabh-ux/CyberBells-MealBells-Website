import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Upload, 
  CheckCircle, 
  LogOut, 
  ChevronDown, 
  Camera 
} from 'lucide-react';

interface UserProfile {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  role: string;
  avatarUrl: string;
}

export const ProfileSettings: React.FC = () => {
  // Initial state mimicking the uploaded image data
  const [profile, setProfile] = useState<UserProfile>({
    fullName: 'Marcus Chen',
    phoneNumber: '+1 (555) 012-3456',
    emailAddress: 'marcus.chen@lunchmate.admin',
    role: 'Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', // Replace with exact asset if available
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-12 font-sans text-slate-800 relative">
      <div className=" space-y-6">
        
        {/* Header Section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal information, role details, and platform preferences.
          </p>
        </div>

        {/* Top Hero Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <img 
                src={profile.avatarUrl} 
                alt={profile.fullName} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#FA7000] p-1.5 rounded-lg text-white shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{profile.fullName}</h2>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 mt-1 justify-center sm:justify-start">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">marcus.chen@mealbells.admin</span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-[#FFF4EC] text-[#FA7000] border border-[#FFE3D1] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FA7000]" />
            Verified Admin
          </span>
        </div>

        {/* Main Content Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (Details and Roles) */}
          <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
            
            {/* Personal Details Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <User className="w-4 h-4" />
                <h2>Personal Details</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FA7000]/20 focus:border-[#FA7000] transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      name="phoneNumber"
                      value={profile.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FA7000]/20 focus:border-[#FA7000] transition"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    name="emailAddress"
                    value={profile.emailAddress}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FA7000]/20 focus:border-[#FA7000] transition"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <Lock className="w-4 h-4" />
                <h2>Role & Permissions</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Current Role</label>
                <div className="relative cursor-not-allowed">
                  <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={profile.role} 
                    disabled
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed appearance-none"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Admin Access:</strong> You currently have full access to menu configuration, financial reports, and team management modules. Role changes require secondary approval from the system owner.
                </p>
              </div>
            </div>

          </form>

          {/* Right Column (Imagery and Actions) */}
          <div className="space-y-6">
            
            {/* Imagery/Upload Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#C06014] font-semibold text-sm">
                <User className="w-4 h-4" />
                <h2>Imagery</h2>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    setProfile(prev => ({ ...prev, avatarUrl: url }));
                  }
                }}
              />

              <div 
                onClick={handleImageClick}
                className="border-2 border-dashed border-[#FFE3D1] bg-white rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition-colors group h-32 sm:h-40"
              >
                <div className="bg-slate-50 p-2.5 rounded-full text-slate-400 group-hover:text-[#FA7000] group-hover:bg-[#FFF4EC] transition-colors mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Change Picture</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[150px]">
                  SVG, PNG, JPG or GIF (max. 800×800px)
                </span>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col gap-3">
              <button 
                type="button"
                onClick={handleSave}
                className="w-full bg-[#FA7000] text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-[#E06400] transition shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </button>
              
              <button 
                type="button"
                className="w-full bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
              >
                Cancel
              </button>

              <hr className="border-slate-100 my-1" />

              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 text-rose-600 font-medium text-sm py-2 hover:text-rose-700 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout Session
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;