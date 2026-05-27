import { memo, useState } from "react";
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
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  return (
    <div className={`w-10 h-10 rounded-full shrink-0 ring-2 ring-white shadow-sm flex items-center justify-center text-white text-xs font-bold ${colors[colorIndex]}`}>
      {initials || "?"}
    </div>
  );
};

const Avatar = ({ user }: { user: User }) => {
  const [imgError, setImgError] = useState(false);
  if (!user.avatar || imgError) return <InitialsAvatar name={user.name || "?"} />;
  return (
    <img
      src={user.avatar}
      alt={user.name}
      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shrink-0"
      onError={() => setImgError(true)}
    />
  );
};

const MobileCard = memo(({ user, onEdit, onToggle }: {
  user: User;
  onEdit: (u: User) => void;
  onToggle: (id: string) => void;
}) => (
  <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {user.name || <Missing label="No name" />}
          </p>
          <p className="text-xs text-[#555F71] truncate">
            {user.email || <Missing label="No email" />}
          </p>
          <p className="text-xs text-[#555F71] mt-0.5">
            {user.phone || <Missing label="No phone" />}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(user)} className="p-2 rounded-md hover:bg-blue-50">
          <img src={editIcon} alt="Edit" width={15} height={15} />
        </button>
        <button onClick={() => onToggle(user.id)} className="p-2 rounded-md hover:bg-red-50">
          <img
            src={user.status === "Active" ?  actionIcon:notActionIcon }
            alt="Toggle"
            width={15}
            height={15}
            className={user.status === "Active" ? "": "opacity-50" }
          />
        </button>
      </div>
    </div>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      {user.department
        ? <span className="bg-[#EEEEEE] text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-md">{user.department}</span>
        : <Missing label="No dept." />
      }
      <StatusBadge s={user.status} />
    </div>
  </div>
));

export default MobileCard;