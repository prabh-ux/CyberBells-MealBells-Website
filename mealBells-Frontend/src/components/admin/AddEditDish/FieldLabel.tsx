import React from 'react'

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => {
  return (
    <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.14em] uppercase text-[var(--text-label)] font-[var(--font-inter)] mb-2">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </p>
  )
}

export default FieldLabel