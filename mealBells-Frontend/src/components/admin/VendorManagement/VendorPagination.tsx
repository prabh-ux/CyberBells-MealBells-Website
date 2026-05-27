interface VendorPaginationProps {
  page: number;
  totalPages: number;
  shownCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function VendorPagination({
  page,
  totalPages,
  shownCount,
  totalCount,
  onPageChange,
}: VendorPaginationProps) {
  const pageNums = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1);

  return (
    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-sm text-gray-500 font-bold">
        Showing {shownCount} of {totalCount} vendors
      </span>

      <div className="flex gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:border-orange-500 transition-all active:scale-95"
        >
          ‹
        </button>

        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 border rounded-xl text-sm font-bold transition-all active:scale-95 ${
              page === p
                ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                : "border-gray-200 text-gray-500 hover:bg-white"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:border-orange-500 transition-all active:scale-95"
        >
          ›
        </button>
      </div>
    </div>
  );
}