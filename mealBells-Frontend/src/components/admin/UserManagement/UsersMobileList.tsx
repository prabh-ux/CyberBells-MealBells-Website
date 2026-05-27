import type { User } from "../../../types/admin";
import MobileCard from "./MobileCard";


interface Props {
  paginated: User[];
  onEdit: (user: User) => void;
  onToggle: (id: string) => void;
}

export default function UsersMobileList({ paginated, onEdit, onToggle }: Props) {
  return (
    <div className="sm:hidden flex flex-col gap-3">
      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-8 text-center text-[#555F71] text-sm">
          No users found.
        </div>
      ) : (
        paginated.map((user, i) => (
          <MobileCard
            key={`${user.id}-${i}`}
            user={user}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        ))
      )}
    </div>
  );
}