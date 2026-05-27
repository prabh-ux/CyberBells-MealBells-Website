import React, { useCallback, useRef, useState } from 'react';
import type { EditModalProps, MenuItem } from '../../../types/admin';
import DropDown   from '../../shared/DropDown';
import FieldLabel from './FieldLabel';
import uploadIconOrange from "../../../assets/uploadIconOrange.png";

const DIET_TYPES = ["Veg", "Non-Veg"];
const TIME_SLOTS = ["Breakfast", "Lunch", "Dinner", "Full Time"];

const EditModal = ({ item, vendorOptions, vendorList, saving, onSave, onClose }: EditModalProps) => {
  const [form,      setForm]      = useState<MenuItem>({ ...item });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const set = (key: keyof MenuItem, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // When vendor NAME changes, also update vendorId
  const handleVendorChange = (name: string) => {
    if (name === "All Vendors") {
      setForm(prev => ({ ...prev, vendor: "", vendorId: "" }));
    } else {
      const matched = vendorList?.find(v => v.name === name);
      setForm(prev => ({
        ...prev,
        vendor:   name,
        vendorId: matched?._id ?? matched?.id ?? prev.vendorId,
      }));
    }
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/) || file.size > 5 * 1024 * 1024) return;
    setImageFile(file);
    setForm(prev => ({ ...prev, imagePreview: URL.createObjectURL(file) }));
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={() => { if (!saving) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)] shrink-0">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">
            Edit Menu Item
          </h2>
          <button
            onClick={() => { if (!saving) onClose(); }}
            disabled={saving}
            className="text-[var(--text-label)] hover:text-[var(--text-primary)] text-xl leading-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          {/* Image */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Dish Image</FieldLabel>
            <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border)]">
              <img
                src={form.imagePreview ?? form.image}
                alt={form.name}
                className="w-full h-[160px] object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <img src={uploadIconOrange} alt="" className="w-6 h-6 object-contain" />
                <span className="text-white text-[12px] font-semibold [font-family:var(--font-inter)]">
                  Replace Image
                </span>
              </button>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`w-full rounded-xl border-2 border-dashed py-3 flex items-center justify-center gap-2 cursor-pointer transition-all text-[12px] font-semibold [font-family:var(--font-inter)] ${
                dragOver
                  ? "border-[#FF7A00] bg-[#FFF7ED] text-[#FF7A00]"
                  : "border-[#E0C0AF] bg-[#F9F9F9] text-[var(--text-label)] hover:border-[#FF7A00] hover:text-[#FF7A00]"
              }`}
            >
              <img src={uploadIconOrange} alt="" className="w-4 h-4 object-contain" />
              Drag & drop or click to replace
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Item Name</FieldLabel>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          {/* Vendor */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Vendor</FieldLabel>
            <DropDown
              wfull
              value={form.vendor || "All Vendors"}
              options={vendorOptions}
              onChange={handleVendorChange}  // ← uses new handler
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none focus:border-[#FF7A00] transition-colors resize-none"
            />
          </div>

          {/* Type + Time Slot */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <FieldLabel>Type</FieldLabel>
              <DropDown
                wfull
                value={form.dishType}
                options={DIET_TYPES}
                onChange={v => set("dishType", v)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <FieldLabel>Time Slot</FieldLabel>
              <DropDown
                wfull
                value={form.availability}
                options={TIME_SLOTS}
                onChange={v => set("availability", v)}
              />
            </div>
          </div>

          <div className="h-32" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--divider)] shrink-0">
          <button
            onClick={() => { if (!saving) onClose(); }}
            disabled={saving}
            className="px-5 py-2 rounded-lg border border-[var(--border)] text-[14px] font-semibold text-[var(--text-label)] hover:text-[var(--text-primary)] [font-family:var(--font-inter)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form, imageFile ?? undefined)}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#FF7A00] hover:brightness-90 active:brightness-75 text-white text-[14px] font-semibold [font-family:var(--font-inter)] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path   className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;