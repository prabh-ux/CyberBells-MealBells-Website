import { memo } from "react";
import editIcon from "../../../assets/editIcon.png";
import notActionIcon from "../../../assets/notActionIcon.png";
import actionIcon from "../../../assets/actionIcon.png";
import type { User } from "../../../types/admin";
import StatusBadge from "./StatusBadge";

const Missing = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
    <span>!</span> {label}
  </span>
);

const InitialsAvatar = ({ name }: { name: string }) => {
  const initials = name.trim().split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const colors = ["bg-orange-400","bg-sky-400","bg-emerald-400","bg-violet-400","bg-rose-400","bg-amber-400"];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full shrink-0 ring-2 ring-white shadow-sm flex items-center justify-center text-white text-xs font-bold ${colors[colorIndex]}`}>
      {initials || "?"}
    </div>
  );
};

const UserRow = memo(({ user, onEdit, onToggle }: {
  user: User;
  onEdit: (u: User) => void;
  onToggle: (id: string) => void;   // 👈 number → string
}) => (
  <tr className="hover:bg-orange-50/30 transition-colors">

    {/* Avatar + Name */}
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        {user.avatar ? (
          <>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sibling) sibling.style.display = "flex";
              }}
            />
            <div style={{ display: "none" }}>
              <InitialsAvatar name={user.name} />
            </div>
          </>
        ) : (
          <InitialsAvatar name={user.name} />
        )}
        <span className="font-semibold text-sm lg:text-base whitespace-nowrap">
          {user.name || <Missing label="No name" />}
        </span>
      </div>
    </td>

    {/* Email */}
    <td className="px-4 py-4 text-[#555F71] text-xs lg:text-sm max-w-[180px] truncate">
      {user.email || <Missing label="No email" />}
    </td>

    {/* Phone */}
    <td className="px-4 py-4 text-[#555F71] text-sm hidden lg:table-cell whitespace-nowrap">
      {user.phone || <Missing label="No phone" />}
    </td>

    {/* Department */}
    <td className="px-4 py-4 hidden md:table-cell">
      {user.department ? (
        <span className="bg-[#EEEEEE] text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-md">
          {user.department}
        </span>
      ) : (
        <Missing label="No dept." />
      )}
    </td>

    {/* Status */}
    <td className="px-4 py-4">
      <StatusBadge s={user.status} />
    </td>

    {/* Actions */}
    <td className="px-4 py-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(user)}
          className="p-1.5 rounded-md hover:bg-blue-50 transition-colors"
        >
          <img src={editIcon} alt="Edit" width={15} height={15} />
        </button>
        <button
          onClick={() => onToggle(user.id)}   // user.id is now correctly string
          className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          <img
            src={user.status === "Active" ? actionIcon : notActionIcon}
            alt="Toggle"
            width={15}
            height={15}
            className={user.status === "Active" ? "" : "opacity-50"}
          />
        </button>
      </div>
    </td>

  </tr>
));

export default UserRow;