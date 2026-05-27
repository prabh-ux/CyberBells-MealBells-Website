import type { LucideIcon } from "lucide-react";

type NavButtonProps = {
  label: string;
  path: string;
  icon?: string | LucideIcon;
  showLabel: boolean;
  isActive: boolean;
  onClick: (path: string) => void;
};

export default function NavButton({
  label,
  path,
  icon,
  showLabel,
  isActive,
  onClick,
}: NavButtonProps) {
  const Icon = icon;

  return (
    <button
      onClick={() => onClick(path)}
      className={`
        relative group flex items-center gap-3
        w-full px-4 py-3
        transition-all duration-200
        border-l-4
        ${
          isActive
            ? "bg-[#334155] border-[#F97316] text-white"
            : "border-transparent text-[#94A3B8] hover:bg-[#334155] hover:border-[#F97316] hover:text-white"
        }
      `}
    >
      {/* PNG Icon */}
      {typeof Icon === "string" && (
        <img
          src={Icon}
          alt={label}
          className={`
            w-5 h-5 shrink-0 object-contain transition-all duration-200
            ${
              isActive
                ? "opacity-100"
                : "opacity-70 group-hover:opacity-100"
            }
          `}
        />
      )}

      {/* Lucide Icon */}
      {typeof Icon !== "string" && Icon && (
        <Icon
          className={`
            w-5 h-5 shrink-0 transition-all duration-200
            ${
              isActive
                ? "opacity-100"
                : "opacity-70 group-hover:opacity-100"
            }
          `}
        />
      )}

      {/* Label */}
      <span
        className={`
          text-sm font-medium
          ${showLabel ? "block" : "hidden"} lg:block
        `}
      >
        {label}
      </span>
    </button>
  );
}