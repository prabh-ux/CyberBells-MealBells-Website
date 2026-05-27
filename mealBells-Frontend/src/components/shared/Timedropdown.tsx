/**
 * TimeDropdown — reusable time picker
 *
 * Features:
 *  - Type directly into H / M fields (free input, clamped on blur)
 *  - AM / PM toggle buttons
 *  - Full minutes 00–59
 *  - Desktop: dropdown panel under trigger
 *  - Mobile: bottom-sheet with scrim
 *  - Clear button when a value is set
 *
 * Exports:
 *   default   TimeDropdown component
 *   TimeValue { h: string; m: string; p: string }
 *   EMPTY_TIME
 *   fmtTime(v)      → "09:30 AM" | ""
 *   timeToMins(v)   → number | -1
 *
 * Usage:
 *   import TimeDropdown, { TimeValue, EMPTY_TIME } from "@/components/TimeDropdown";
 *   const [t, setT] = useState<TimeValue>(EMPTY_TIME);
 *   <TimeDropdown value={t} onChange={setT} placeholder="Select time" />
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, X, ChevronDown } from "lucide-react";

// ── Exported types & helpers ──────────────────────────────────────────────────
export interface TimeValue {
  h: string; // "1"–"12"  (no leading zero required)
  m: string; // "0"–"59"
  p: string; // "AM" | "PM"
}

export const EMPTY_TIME: TimeValue = { h: "", m: "", p: "" };

export const fmtTime = ({ h, m, p }: TimeValue): string => {
  if (!h || !m || !p) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${p}`;
};

export const timeToMins = ({ h, m, p }: TimeValue): number => {
  if (!h || !m || !p) return -1;
  return (parseInt(h) % 12 + (p === "PM" ? 12 : 0)) * 60 + parseInt(m);
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface TimeDropdownProps {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
const TimeDropdown = ({
  value,
  onChange,
  placeholder = "Select time",
  error,
  label,
  disabled = false,
  className = "",
}: TimeDropdownProps) => {
  const [open, setOpen]   = useState(false);
  // draft holds raw strings while editing; committed on confirm/blur
  const [draft, setDraft] = useState<TimeValue>(EMPTY_TIME);
  // raw display strings for the two inputs (allows partial typing)
  const [rawH, setRawH]   = useState("");
  const [rawM, setRawM]   = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Open / close ────────────────────────────────────────────────────────────
  const openPanel = () => {
    if (disabled) return;
    const seed = value.h ? value : EMPTY_TIME;
    setDraft(seed);
    setRawH(seed.h);
    setRawM(seed.m);
    setOpen(true);
  };

  const closePanel = useCallback(() => setOpen(false), []);

  // Outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closePanel();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closePanel]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closePanel]);

  // Body scroll lock on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Draft helpers ────────────────────────────────────────────────────────────
  const setP = (p: string) => setDraft((d) => ({ ...d, p }));

  // Clamp hour 1–12 on blur
  const commitH = (raw: string) => {
    const n = parseInt(raw);
    const clamped = isNaN(n) ? "" : String(Math.min(12, Math.max(1, n)));
    setRawH(clamped);
    setDraft((d) => ({ ...d, h: clamped }));
  };

  // Clamp minute 0–59 on blur
  const commitM = (raw: string) => {
    const n = parseInt(raw);
    const clamped = isNaN(n) ? "" : String(Math.min(59, Math.max(0, n)));
    setRawM(clamped);
    setDraft((d) => ({ ...d, m: clamped }));
  };

  const canConfirm = !!(draft.h && draft.m !== "" && draft.p);

  const confirm = () => {
    if (!canConfirm) return;
    onChange(draft);
    closePanel();
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(EMPTY_TIME);
  };

  // ── Derived display ──────────────────────────────────────────────────────────
  const formatted = fmtTime(value);

  // ── Styles ───────────────────────────────────────────────────────────────────
  const triggerCls = [
    "flex items-center gap-3 border rounded-xl px-4 h-12 w-full transition-all select-none",
    disabled
      ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200"
      : error
      ? "border-red-400 bg-red-50 cursor-pointer"
      : open
      ? "border-orange-500 bg-white ring-2 ring-orange-500/10 cursor-pointer"
      : "border-gray-200 bg-gray-50 hover:border-gray-300 cursor-pointer",
  ].join(" ");

  // ── Inner panel (shared desktop + mobile) ────────────────────────────────────
  const panel = (
    <div className="flex flex-col">
      {/* Inputs row */}
      <div className="p-4 pb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Enter or adjust time
        </p>

        <div className="flex items-center gap-2">
          {/* Hour input */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-gray-400 font-semibold">Hour</span>
            <div className="relative w-full">
              <input
                type="number" min={1} max={12}
                value={rawH}
                onChange={(e) => { setRawH(e.target.value); setDraft((d) => ({ ...d, h: e.target.value })); }}
                onBlur={(e) => commitH(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="12"
                className="w-full h-12 text-center text-xl font-bold rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 text-gray-700 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <span className="text-2xl font-bold text-gray-300 mt-4">:</span>

          {/* Minute input */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-gray-400 font-semibold">Minute</span>
            <input
              type="number" min={0} max={59}
              value={rawM}
              onChange={(e) => { setRawM(e.target.value); setDraft((d) => ({ ...d, m: e.target.value })); }}
              onBlur={(e) => commitM(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="00"
              className="w-full h-12 text-center text-xl font-bold rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 text-gray-700 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* AM / PM */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 font-semibold">Period</span>
            <div className="flex flex-col gap-1">
              {["AM", "PM"].map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => setP(p)}
                  className={`w-14 h-[22px] rounded-lg text-xs font-bold transition-all ${
                    draft.p === p
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick-select minute pills */}
        <div className="mt-3">
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Quick minutes</p>
          <div className="flex gap-1.5 flex-wrap">
            {["00", "15", "30", "45"].map((m) => (
              <button
                key={m} type="button"
                onClick={() => { setRawM(m); setDraft((d) => ({ ...d, m })); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  draft.m === m
                    ? "bg-orange-50 border-orange-300 text-orange-600"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                }`}
              >
                :{m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      {canConfirm && (
        <div className="mx-4 mb-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl text-center">
          <span className="text-lg font-bold text-orange-600 tracking-wide">
            {String(draft.h).padStart(2, "0")}:{String(draft.m).padStart(2, "0")} {draft.p}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
        <button type="button" onClick={closePanel}
          className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold transition-colors">
          Cancel
        </button>
        <button type="button" onClick={confirm} disabled={!canConfirm}
          className="text-sm px-5 py-2 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40 hover:bg-orange-600 active:scale-95 transition-all">
          Set time
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        onClick={openPanel}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPanel(); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerCls}
      >
        <Clock size={16} className={`shrink-0 ${error ? "text-red-400" : "text-gray-400"}`} />
        <span className={`flex-1 text-sm text-left truncate ${formatted ? "text-gray-700" : "text-gray-400"}`}>
          {formatted || placeholder}
        </span>
        {formatted && !disabled ? (
          <button type="button" onClick={clear} aria-label="Clear"
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded">
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-orange-500" : "text-gray-400"}`} />
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}

      {/* ── Desktop dropdown ── */}
      {open && (
        <>
          <div className="hidden sm:block fixed inset-0 z-40" onClick={closePanel} />
          <div className="hidden sm:block absolute top-[calc(100%+6px)] left-0 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {panel}
          </div>
        </>
      )}

      {/* ── Mobile bottom sheet ── */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-700">Select time</p>
              <button type="button" onClick={closePanel}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeDropdown;