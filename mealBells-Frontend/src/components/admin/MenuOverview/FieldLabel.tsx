import React from 'react'


const FieldLabel=({ children }: { children: React.ReactNode })=> {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-label)] [font-family:var(--font-inter)]">
      {children}
    </label>
  );
}

export default FieldLabel

