import { useState } from 'react'

interface StatCardProps {
  icon:     string
  bg:       string
  label:    string
  value:    string
  /** Called with the new value whenever the user confirms an edit */
  onChange?: (value: string) => void
}

const StatCard = ({ icon, bg, label, value, onChange }: StatCardProps) => {
  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState(value)

  // Keep inputVal in sync if the parent resets value (e.g. Cancel button)
  // Using a key on the component from the parent is the cleanest approach,
  // but a simple derived-state guard also works for this use-case.
  const handleConfirm = () => {
    const next = inputVal.trim() || value
    setEditing(false)
    onChange?.(next)
  }

  const handleOpen = () => {
    setInputVal(value)   // always start from parent's current value
    setEditing(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4">
      <div className={`${bg} p-2.5 sm:p-3 rounded-lg shrink-0`}>
        <img src={icon} alt="" className="w-5 h-5 sm:w-[22px] sm:h-[22px] object-contain" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-label)] font-[var(--font-inter)]">
          {label}
        </p>

        {editing ? (
          <input
            autoFocus
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleConfirm}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleConfirm()
              if (e.key === 'Escape') { setInputVal(value); setEditing(false) }
            }}
            className="mt-0.5 w-full text-[16px] sm:text-[18px] font-medium text-[var(--text-primary)] font-[var(--font-manrope)] border-b border-[#FF7A00] focus:outline-none bg-transparent leading-tight"
          />
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            title="Click to edit"
            className="mt-0.5 text-left w-full text-[16px] sm:text-[18px] font-medium text-[var(--text-primary)] font-[var(--font-manrope)] leading-tight hover:text-[#FF7A00] transition-colors group flex items-center gap-1.5"
          >
            {value}
            <svg
              className="w-3 h-3 text-[var(--text-label)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default StatCard