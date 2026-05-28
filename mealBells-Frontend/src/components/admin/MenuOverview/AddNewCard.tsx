
const AddNewCard=({ onClick }: { onClick: () => void })=> {
  return (
    <div
      onClick={onClick}
      className="border bg-white border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-[#FF7A00] transition-colors min-h-[300px]"
    >
      <div className="w-11 h-11 rounded-full border-2 border-[var(--placeholder)] group-hover:border-[#FF7A00] flex items-center justify-center transition-colors">
        <span className="text-xl leading-none text-[var(--placeholder)] group-hover:text-[#FF7A00] transition-colors select-none">+</span>
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-[var(--text-primary)] [font-family:var(--font-manrope)]">Add New Item</p>
        <p className="text-[12px] text-[var(--text-label)] mt-0.5 [font-family:var(--font-inter)]">Create a new dish entry</p>
      </div>
    </div>
  );
}

export default AddNewCard