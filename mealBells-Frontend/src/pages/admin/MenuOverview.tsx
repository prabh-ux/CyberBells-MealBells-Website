import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import uploadIconOrange from "../../assets/uploadIconOrange.png";
import menuItem1 from "../../assets/menuItem1.png";
import menuItem2 from "../../assets/menuItem2.png";
import menuItem3 from "../../assets/menuItem3.png";
import menuItem4 from "../../assets/menuItem4.png";
import menuItem1Icon from "../../assets/menuItem1Icon.png";
import menuItem2Icon from "../../assets/menuItem2Icon.png";
import menuItem3Icon from "../../assets/menuItem3Icon.png";
import menuItem4Icon from "../../assets/menuItem4Icon.png";
import clock from "../../assets/clock.png";
import editIconWhite from "../../assets/editIconWhite.png";
import DropDown from "../../components/shared/DropDown";
import type { PeriodKey, VendorKey } from "../../types/admin";

// ─── Types ────────────────────────────────────────────────────────────────────
type DietType = "VEG" | "NON-VEG";

const VENDORS = ["All Vendors", "The Healthy Kitchen", "Spice Route", "Green Gourmet"];
const VENDOR_OPTIONS = VENDORS.filter((v) => v !== "All Vendors");
const PERIODS = ["This Month", "Last Month", "Last 3 Months", "This Year"];
const TIME_SLOTS = ["Lunch Only", "Dinner Only", "Full Day", "Breakfast Only"];
const DIET_TYPES = ["VEG", "NON-VEG"];
const TABS = ["Today", "Weekly", "Monthly"] as const;

interface MenuItem {
  id: number;
  name: string;
  vendor: string;
  description: string;
  type: DietType;
  timeSlot: string;
  image: string;
  imagePreview?: string;
  icon: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const initialMenuItems: MenuItem[] = [
  { id: 1, name: "Grilled Salmon",       vendor: "The Healthy Kitchen", description: "Fresh Atlantic salmon grilled to perfection with lemon butter glaze and", type: "NON-VEG", timeSlot: "Lunch Only",  image: menuItem1, icon: menuItem1Icon },
  { id: 2, name: "Paneer Tikka",         vendor: "Spice Route",         description: "Marinated cottage cheese cubes roasted in a tandoor with bell peppers…",  type: "VEG",     timeSlot: "Full Day",    image: menuItem2, icon: menuItem2Icon },
  { id: 3, name: "Avocado Buddha Bowl",  vendor: "Green Gourmet",       description: "Nutrient-rich bowl with organic quinoa, roasted chickpeas, kale, and fresh…", type: "VEG",  timeSlot: "Lunch Only",  image: menuItem3, icon: menuItem3Icon },
  { id: 4, name: "Smoked BBQ Ribs",      vendor: "Spice Route",         description: "8-hour smoked pork ribs basted in house-special hickory barbecue sauce.",  type: "NON-VEG", timeSlot: "Dinner Only", image: menuItem4, icon: menuItem4Icon },
];

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-label)] [font-family:var(--font-inter)]">
      {children}
    </label>
  );
}

// ─── Diet Badge ───────────────────────────────────────────────────────────────
function DietBadge({ type }: { type: DietType }) {
  return (
    <span className={`absolute top-3 left-3 px-2.5 py-[3px] rounded-full text-[10px] font-bold tracking-widest uppercase [font-family:var(--font-inter)] ${
      type === "VEG" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"
    }`}>
      {type}
    </span>
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────
function MenuCard({ item, onEdit }: { item: MenuItem; onEdit: (item: MenuItem) => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col">
      <div className="relative">
        <img src={item.imagePreview ?? item.image} alt={item.name} className="w-full h-[192px] object-cover" />
        <DietBadge type={item.type} />
      </div>

      <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[18px] font-normal font-(--manrope) text-[var(--text-primary)] leading-snug">
            {item.name}
          </h3>
          <div className="bg-[#FFF7ED] rounded-full p-1">
            <img src={item.icon} alt="" className="w-[9px] h-[17px] object-contain opacity-80" />
          </div>
        </div>

        <p className="text-[12px] font-semibold text-[#FF7A00] mb-2 [font-family:var(--font-inter)]">
          {item.vendor}
        </p>
        <p className="text-[14px] leading-[1.5] text-[var(--text-label)] line-clamp-2 flex-1 mb-4">
          {item.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-label)] [font-family:var(--font-inter)]">
            <img src={clock} alt="" className="w-3.5 h-3.5 object-contain" />
            {item.timeSlot}
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

// ─── Add New Card ─────────────────────────────────────────────────────────────
function AddNewCard({ onClick }: { onClick: () => void }) {
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
  item: MenuItem;
  onSave: (updated: MenuItem) => void;
  onClose: () => void;
}

function EditModal({ item, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<MenuItem>({ ...item });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof MenuItem, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/) || file.size > 5 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imagePreview: url }));
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  function handleSave() {
    onSave(form);
    onClose();
  }

  const displayImage = form.imagePreview ?? form.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      {/* Panel — no overflow-hidden so dropdowns aren't clipped */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header — sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)] shrink-0">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">
            Edit Menu Item
          </h2>
          <button onClick={onClose} className="text-[var(--text-label)] hover:text-[var(--text-primary)] text-xl leading-none transition-colors">
            ×
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

          {/* Dish Image */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Dish Image</FieldLabel>
            <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border)]">
              <img src={displayImage} alt={form.name} className="w-full h-[160px] object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <img src={uploadIconOrange} alt="" className="w-6 h-6 object-contain" />
                <span className="text-white text-[12px] font-semibold [font-family:var(--font-inter)]">Replace Image</span>
              </button>
            </div>
            {/* Drop zone (shown below image as alt) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Item Name</FieldLabel>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          {/* Vendor */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Vendor</FieldLabel>
            <DropDown wfull={true} value={form.vendor} options={VENDOR_OPTIONS} onChange={(v) => set("vendor", v)} />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none focus:border-[#FF7A00] transition-colors resize-none"
            />
          </div>

          {/* Type + Time Slot */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <FieldLabel>Type</FieldLabel>
              <DropDown wfull={true} value={form.type} options={DIET_TYPES} onChange={(v) => set("type", v)} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <FieldLabel>Time Slot</FieldLabel>
              <DropDown wfull={true} value={form.timeSlot} options={TIME_SLOTS} onChange={(v) => set("timeSlot", v)} />
            </div>
          </div>

          {/* Extra bottom padding so last dropdown has room to open */}
          <div className="h-32" />
        </div>

        {/* Footer — sticky */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--divider)] shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-[var(--border)] text-[14px] font-semibold text-[var(--text-label)] hover:text-[var(--text-primary)] [font-family:var(--font-inter)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-[#FF7A00] hover:brightness-90 active:brightness-75 text-white text-[14px] font-semibold [font-family:var(--font-inter)] transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MenuOverview = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Today");
  const [vendor, setVendor] = useState<VendorKey>("All Vendors");
  const [period, setPeriod] = useState<PeriodKey>("This Month");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  function handleSave(updated: MenuItem) {
    setMenuItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] [font-family:var(--font-inter)]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7">
          <div>
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
              Menu Overview
            </h1>
            <p className="text-[16px] text-[var(--text-label)] mt-1 [font-family:var(--font-inter)]">
              Manage and organize your catering menus across vendors.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DropDown value={vendor} options={VENDORS} onChange={(v) => setVendor(v as VendorKey)} />
            <DropDown value={period} options={PERIODS} onChange={(v) => setPeriod(v as PeriodKey)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--divider)] mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-[2px] mr-6 pb-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-[#FF7A00] text-[#FF7A00]"
                  : "border-transparent text-[var(--text-label)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {menuItems.map((item) => (
            <MenuCard key={item.id} item={item} onEdit={setEditingItem} />
          ))}
          <AddNewCard onClick={() => navigate("/admin/menu-management")} />
        </div>
      </div>

      {editingItem && (
        <EditModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default MenuOverview;