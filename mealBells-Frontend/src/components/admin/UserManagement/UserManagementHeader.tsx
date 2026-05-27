import { STATUS } from "../../../data/adminData";
import type { StatusKey } from "../../../types/admin";
import searchIcon from "../../../assets/searchIcon.png";
import DropDown from "../../shared/DropDown";


interface Props {
  search: string;
  status: StatusKey;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusKey) => void;
}

export default function UserManagementHeader({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-[#555F71] mt-0.5 sm:mt-1 max-w-xs">
            Manage and monitor platform access for all organization members.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 lg:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={searchIcon} alt="Search" width={15} height={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 text-[#6B7280]"
            />
          </div>
          <DropDown
            value={status}
            options={STATUS}
            onChange={(v) => onStatusChange(v as StatusKey)}
          />
        </div>
      </div>
    </div>
  );
}