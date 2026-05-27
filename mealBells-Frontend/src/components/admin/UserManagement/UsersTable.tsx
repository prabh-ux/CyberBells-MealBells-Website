import type { User } from "../../../types/admin";
import UserRow from "./UserRow";

interface Props {
  paginated: User[];
  onEdit: (user: User) => void;
  onToggle: (id: string) => void;  // 👈 number → string
}

const HEADERS = ["User", "Email", "Phone", "Department", "Status", "Actions"];

export default function UsersTable({ paginated, onEdit, onToggle }: Props) {
  return (
    <div className="hidden sm:block">
      <div className="bg-white rounded-t-xl border border-[#F3F4F6] shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead className="bg-[#F3F3F3] text-[#555F71]">
            <tr className="border-b border-gray-100">
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wide ${
                    i === 2
                      ? "hidden lg:table-cell"
                      : i === 3
                        ? "hidden md:table-cell"
                        : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[#555F71] text-sm">
                  No users found.
                </td>
              </tr>
            ) : (
              paginated.map((user, i) => (
                <UserRow
                  key={`${user.id}-${i}`}
                  user={user}
                  onEdit={onEdit}
                  onToggle={onToggle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}