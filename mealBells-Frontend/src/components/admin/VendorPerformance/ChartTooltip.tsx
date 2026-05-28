

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      {label && <p className="font-semibold mb-0.5">{label}</p>}
      <p>{payload[0]?.name ?? "Value"}: <span className="text-[#FF7A00] font-bold">{payload[0]?.value}</span></p>
    </div>
  );
};
export default ChartTooltip