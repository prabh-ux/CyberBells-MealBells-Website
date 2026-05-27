export default function StatusBadge({ status }: { status: boolean }) {
  return (
    <span
      className={`text-[10px] sm:text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${
        status
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : "bg-red-100 text-red-800 border-red-300"
      }`}
    >
      {status ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}