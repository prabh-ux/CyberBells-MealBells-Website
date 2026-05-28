
const StatusBadge = ({ delayed, status }: { delayed: boolean; status: string }) => (
  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
    delayed ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#D1FAE5] text-[#047857]"
  }`}>
    {status}
  </span>
);

export default StatusBadge