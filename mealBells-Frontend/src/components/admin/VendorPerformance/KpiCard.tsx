import React, { useState } from 'react'

const KpiCard = ({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="bg-white rounded-xl p-4 flex flex-col gap-2 border border-[#e6cdb8] relative cursor-default"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--text-label)]">{label}</p>
      {children}
      {tooltip && show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default KpiCard