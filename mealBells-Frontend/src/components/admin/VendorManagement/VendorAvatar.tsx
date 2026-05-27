import { useState } from "react";

const AVATAR_COLORS = ["#F59E0B", "#6366F1", "#EC4899", "#10B981", "#3B82F6", "#F97316"];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.trim().split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

interface VendorAvatarProps {
  name: string;
  logo: string;
  size?: "sm" | "md";
}

export default function VendorAvatar({ name, logo, size = "sm" }: VendorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const color    = getAvatarColor(name);
  const dim      = size === "md" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setImgError(true)}
        className={`${dim} rounded-lg object-cover border-2 border-gray-100`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center font-bold shrink-0 border-2`}
      style={{ backgroundColor: color + "22", borderColor: color + "44", color }}
    >
      {initials || "?"}
    </div>
  );
}

export { getAvatarColor, getInitials };