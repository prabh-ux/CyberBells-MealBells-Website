import { memo, useEffect, useRef, useState } from "react";
import chevronIcon from "../../assets/chevronIcon.png";

type DropDownProps = {
  icon?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  wfull?: boolean;
  placeholder?: string;
  hasError?: boolean;        // 👈 red border when nothing selected
};

const DropDown = memo(({ icon, value, options, onChange, wfull, placeholder = "Select…", hasError }: DropDownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isEmpty = !value;

  return (
    <div className={`relative ${wfull ? "w-full" : ""}`} ref={ref}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between border rounded-xl px-3 py-[10px] bg-white cursor-pointer select-none transition-colors
          ${hasError || isEmpty
            ? "border-red-300 bg-red-50"        // red when empty
            : "border-[#e6cdb8]"                // normal
          }`}
      >
        <div className="flex gap-2.5 items-center">
          {icon && <img src={icon} alt="" className="w-4 h-4" />}
          <span className={`text-sm font-medium font-[var(--font-inter)] ${isEmpty ? "text-[#9CA3AF]" : "text-[#334155]"}`}>
            {value || placeholder}
          </span>
        </div>
        <img
          src={chevronIcon}
          alt=""
          className={`w-2 h-auto ml-1 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Options */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-[#e6cdb8] rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              type="button"                          // 👈 stops form-submit lag
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-[var(--font-inter)] transition-colors hover:bg-[#FFF7ED]
                ${opt === value ? "font-semibold text-[#FF7A00]" : "text-[var(--text-primary)]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default DropDown;