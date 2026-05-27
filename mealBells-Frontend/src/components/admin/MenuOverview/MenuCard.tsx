import React from 'react'
import type { MenuItem } from '../../../types/admin';
import DietBadge from './DietBadge';
import clock             from "../../../assets/clock.png";
import editIconWhite     from "../../../assets/editIconWhite.png";

const  MenuCard=({ item, onEdit }: { item: MenuItem; onEdit: (item: MenuItem) => void })=> {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col">
      <div className="relative">
        <img src={item.imagePreview ?? item.image} alt={item.name} className="w-full h-[192px] object-cover" />
        <DietBadge type={item.dishType} />
      </div>
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[18px] font-normal font-(--manrope) text-[var(--text-primary)] leading-snug">{item.name}</h3>
          <div className="bg-[#FFF7ED] rounded-full p-1">
            <img src={item.icon} alt="" className="w-[9px] h-[17px] object-contain opacity-80" />
          </div>
        </div>
        <p className="text-[12px] font-semibold text-[#FF7A00] mb-2 [font-family:var(--font-inter)]">{item.vendor}</p>
        <p className="text-[14px] leading-[1.5] text-[var(--text-label)] line-clamp-2 flex-1 mb-4">{item.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-label)] [font-family:var(--font-inter)]">
            <img src={clock} alt="" className="w-3.5 h-3.5 object-contain" />
            {item.availability}
          </span>
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 bg-[#FF7A00] hover:brightness-90 active:brightness-75 text-white text-[13px] font-semibold px-4 py-[7px] rounded-lg transition-all [font-family:var(--font-inter)]"
          >
            <img src={editIconWhite} alt="" className="w-3 h-3 object-contain" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuCard