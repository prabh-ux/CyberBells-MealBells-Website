import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { fetchMe } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";

const VendorHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);

  const isSettings = location.pathname === "/vendor/settings";

  useEffect(() => {
    if (!user) dispatch(fetchMe());
  }, []);

  const avatarSrc = user?.avatar || null;
  const initials = user?.name?.[0]?.toUpperCase() ?? "V";
  const vendorName = user?.name ?? "Green Bistro";

  const Avatar = () =>
    avatarSrc ? (
      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-[#FFF4EC] flex items-center justify-center text-xs font-bold text-[#FA7000]">
        {initials}
      </div>
    );

  return (
    <header className="w-full h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
      {/* Left: Avatar + Vendor Name */}
      <div className="flex items-center gap-2.5"  onClick={() => navigate("/")}>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0">
          <Avatar />
        </div>
        <span className="text-[#EA580C] font-bold text-base tracking-tight">
          {vendorName}
        </span>
      </div>

      {/* Right: Settings */}
      <button
        type="button"
        onClick={() => navigate("/vendor/settings")}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
          isSettings
            ? "bg-orange-100 ring-2 ring-orange-400"
            : "hover:bg-gray-100"
        }`}
      >
        <Settings
          className={`w-5 h-5 ${
            isSettings ? "text-orange-500" : "text-gray-400"
          }`}
        />
      </button>
    </header>
  );
};

export default VendorHeader;