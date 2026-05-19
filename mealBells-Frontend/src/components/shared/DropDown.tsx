import React, { useEffect, useRef, useState } from 'react'
import chevronIcon from '../../assets/chevronIcon.png'

type DropDownProps = {
  icon?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  wfull?:boolean
};

const DropDown = ({ icon, value, options, onChange,wfull }: DropDownProps) => {

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative ${wfull && 'w-full' }  `} ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between border rounded-lg px-3 py-1.5 bg-white cursor-pointer border-[#e6cdb8] select-none"
      >
<div className='flex gap-2.5'>
        {icon && (
          <img src={icon} alt="" className="w-4 h-4" />
        )}

        <span className="text-sm  text-[#334155] font-medium font-[var(--font-inter)] text-[var(--text-primary)]">
          {value}
        </span>
</div>
        <img
          src={chevronIcon}
          alt=""
          className={`w-2 h-auto ml-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#e6cdb8] rounded-xl shadow-lg overflow-hidden min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-[var(--font-inter)] transition-colors hover:bg-[#FFF7ED] ${
                opt === value
                  ? "font-semibold text-[#FF7A00]"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropDown;