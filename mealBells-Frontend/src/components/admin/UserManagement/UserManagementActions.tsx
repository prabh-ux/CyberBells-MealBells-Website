import { useRef } from "react";
import plus from "../../../assets/plus.png";
import importIcon from "../../../assets/import.png";

interface Props {
  filteredCount: number;
  totalCount: number;
  onAddUser: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UserManagementActions({
  filteredCount,
  totalCount,
  onAddUser,
  onImportCSV,
}: Props) {
  const csvRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAddUser}
          className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-orange-600 text-white text-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          <img src={plus} alt="Add" width={11.67} height={11.67} />
          Add New User
        </button>
        <button
          onClick={() => csvRef.current?.click()}
          className="flex items-center gap-1.5 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#555F71] text-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          <img src={importIcon} alt="Upload" width={13.33} height={13.33} />
          <span className="hidden sm:inline">Import Users (CSV)</span>
          <span className="sm:hidden">Import CSV</span>
        </button>
        <input
          ref={csvRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            onImportCSV(e);
            e.target.value = "";
          }}
        />
      </div>
      <span className="text-xs sm:text-sm text-[#555F71] whitespace-nowrap">
        Showing {filteredCount} of {totalCount} users
      </span>
    </div>
  );
}