// components/admin/VendorPerformance/StatusBadge.tsx

interface Props { onTime: boolean }

const StatusBadge = ({ onTime }: Props) => (
  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
    onTime
      ? "bg-[#D1FAE5] text-[#047857]"
      : "bg-[#FFEDD5] text-[#C2410C]"
  }`}>
    {onTime ? "On Time" : "Delayed"}
  </span>
);

export default StatusBadge;