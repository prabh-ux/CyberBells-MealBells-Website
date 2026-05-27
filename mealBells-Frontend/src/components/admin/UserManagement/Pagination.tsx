interface Props {
  safePage: number;
  totalPages: number;
  pageNums: number[];
  onGoTo: (page: number) => void;
}

export default function Pagination({
  safePage,
  totalPages,
  pageNums,
  onGoTo,
}: Props) {
  return (
    <div className="flex items-center justify-between bg-white border border-t-0 rounded-b-xl border-[#F3F4F6] px-3 py-2.5 mb-4 sm:mb-6">
      <button
        onClick={() => onGoTo(safePage - 1)}
        disabled={safePage === 1}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-[#374151] border border-[#E5E7EB] shadow-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        ‹ Previous
      </button>

      <div className="flex items-center gap-1">
        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onGoTo(p)}
            className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${
              safePage === p
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 4 && (
          <>
            <span className="px-1 text-gray-400 text-sm">...</span>
            <button
              onClick={() => onGoTo(totalPages)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                safePage === totalPages
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onGoTo(safePage + 1)}
        disabled={safePage === totalPages}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-[#374151] border border-[#E5E7EB] shadow-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        Next ›
      </button>
    </div>
  );
}