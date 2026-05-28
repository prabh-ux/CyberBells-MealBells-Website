import type { DietType } from '../../../types/admin';

const DietBadge=({ type }: { type: DietType })=> {
  const isVeg = type === "Veg";
  return (
    <span className={`absolute top-3 left-3 px-2.5 py-[3px] rounded-full text-[10px] font-bold tracking-widest uppercase [font-family:var(--font-inter)] ${
      isVeg ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"
    }`}>
      {type}
    </span>
  );
}


export default DietBadge