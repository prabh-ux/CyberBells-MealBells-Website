import { useCallback, useRef, useState } from 'react'
import cutleryIcon from '../../assets/cutlerryGray.png'
import menuItem2Icon from '../../assets/menuItem2Icon.png'
import nonvegIcon from '../../assets/nonvegIcon.png'
import vendorsIcon from '../../assets/vendorGray.png'
import calanderIcon from '../../assets/calanderGray.png'
import uploadIconOrange from '../../assets/uploadIconOrange.png'
import save from '../../assets/save.png'
import clockOrange from '../../assets/clock-orange.png'
import qualityScore from '../../assets/quality-score.png'
import calories from '../../assets/calories.png'
import DropDown from '../../components/shared/DropDown'
import type { PeriodKey, VendorKey } from '../../types/admin'

// ─── Types ────────────────────────────────────────────────────────────────────
type DishType = 'Veg' | 'Non-Veg'
type ToastType = 'success' | 'error'

const VENDORS = ['All Vendors', 'The Healthy Kitchen', 'Spice Route', 'Green Gourmet']
const PERIODS = ['This Month', 'Last Month', 'Last 3 Months', 'This Year']

interface FormState {
  dishName: string
  dishType: DishType
  description: string
  ingredients: string
  vendor: string
  period: string
  imageFile: File | null
  imagePreview: string | null
}

const EMPTY_FORM: FormState = {
  dishName: '',
  dishType: 'Veg',
  description: '',
  ingredients: '',
  vendor: 'All Vendors',
  period: 'This Month',
  imageFile: null,
  imagePreview: null,
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastState { visible: boolean; message: string; type: ToastType }

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast.visible) return null
  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:min-w-[220px] sm:max-w-[360px] z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-[14px] font-medium shadow-xl animate-[toastIn_0.22s_ease] ${
      toast.type === 'success' ? 'bg-[#1a1a1a]' : 'bg-red-900'
    }`}>
      <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
        toast.type === 'success' ? 'bg-[#FF7A00]' : 'bg-red-500'
      }`}>
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-base leading-none px-0.5">×</button>
    </div>
  )
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.14em] uppercase text-[var(--text-label)] font-[var(--font-inter)] mb-2">
      {children}
    </p>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, bg, label, value }: { icon: string; bg: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4">
      <div className={`${bg} p-2.5 sm:p-3 rounded-lg shrink-0`}>
        <img src={icon} alt="" className="w-5 h-5 sm:w-[22px] sm:h-[22px] object-contain" />
      </div>
      <div>
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-label)] font-[var(--font-inter)]">
          {label}
        </p>
        <p className="text-[16px] sm:text-[18px] font-medium text-[var(--text-primary)] mt-0.5 leading-tight font-[var(--font-manrope)]">
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const AddEditDish = () => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const showToast = (message: string, type: ToastType = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ visible: true, message, type })
    toastTimerRef.current = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000)
  }

  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast((p) => ({ ...p, visible: false }))
  }

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/) || file.size > 5 * 1024 * 1024) return
    setForm((p) => ({ ...p, imageFile: file, imagePreview: URL.createObjectURL(file) }))
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = () => {
    const name = form.dishName.trim() || 'Unnamed dish'
    showToast(`"${name}" saved successfully`)
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-[var(--font-manrope)] px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[var(--text-primary)] tracking-tight">
            Add/Edit Dish
          </h1>
          <p className="text-[13px] sm:text-[15px] text-[var(--text-label)] font-[var(--font-inter)] mt-0.5 sm:mt-1">
            Configure dish details, dietary preferences, and availability.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-[var(--font-inter)] mt-1.5">
          <span className="text-[var(--text-label)]">Dashboard</span>
          <span className="text-[var(--text-label)]">/</span>
          <span className="font-semibold text-[#EA580C]">Manage Dishes</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-5">
        <div className="p-4 sm:p-5 lg:p-7">

          {/* Row 1 — Dish Name + Dish Type */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div className="flex-1">
              <FieldLabel>Dish Name</FieldLabel>
              <div className="flex items-center gap-3 border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-[11px] focus-within:border-[#F97316] transition-colors">
                <img src={cutleryIcon} alt="" className="w-[15px] h-[15px] object-contain shrink-0" />
                <input
                  type="text"
                  value={form.dishName}
                  onChange={(e) => set('dishName', e.target.value)}
                  placeholder="e.g. Grilled Mediterranean Salmon"
                  className="flex-1 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="sm:w-[260px] lg:w-[280px]">
              <FieldLabel>Dish Type</FieldLabel>
              <div className="flex gap-2 sm:gap-3">
                {(['Veg', 'Non-Veg'] as DishType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('dishType', type)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-[11px] text-[13px] sm:text-[14px] font-bold border-2 font-[var(--font-inter)] transition-all ${
                      form.dishType === type
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#EA580C]'
                        : 'border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-light)]'
                    }`}
                  >
                    <img src={type === 'Veg' ? menuItem2Icon : nonvegIcon} alt="" className="w-4 h-4 object-contain" />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5 sm:mb-6">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Briefly describe the dish's flavor profile, portion size, and presentation..."
              className="w-full border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none focus:border-[#F97316] resize-none transition-colors"
            />
          </div>

          {/* Dish Image */}
          <div className="mb-5 sm:mb-6">
            <FieldLabel>Dish Image</FieldLabel>
            {form.imagePreview ? (
              <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border)]">
                <img src={form.imagePreview} alt="Dish preview" className="w-full h-[160px] sm:h-[200px] object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageFile: null, imagePreview: null }))}
                  className="absolute top-3 right-3 bg-white border border-[var(--border)] text-[var(--text-label)] font-[var(--font-inter)] text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--page-bg)] transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`w-full rounded-2xl border-2 border-dashed py-9 sm:py-14 flex flex-col items-center justify-center gap-3 sm:gap-4 cursor-pointer select-none transition-all ${
                  dragOver ? 'border-[var(--brand)] bg-[var(--divider)]' : 'border-[#E0C0AF] bg-[#F3F3F3] hover:border-[#EA580C]'
                }`}
              >
                <div className="w-11 h-11 sm:w-[54px] sm:h-[54px] bg-white rounded-full flex items-center justify-center shadow-sm">
                  <img src={uploadIconOrange} alt="" className="w-5 h-5 sm:w-[26px] sm:h-[26px] object-contain" />
                </div>
                <div className="text-center px-4">
                  <p className="text-[14px] sm:text-[16px] font-bold text-[var(--text-primary)] font-[var(--font-manrope)]">
                    Drag and drop dish photo here
                  </p>
                  <p className="text-[12px] sm:text-[14px] text-[#64748B] font-[var(--font-inter)] mt-1">
                    Supported formats: JPG, PNG, WEBP (Max 5MB)
                  </p>
                  <p className="text-[11px] text-[#EA580C] font-[var(--font-inter)] mt-1.5 sm:hidden font-semibold">
                    Tap to browse files
                  </p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
          </div>

          {/* Ingredients + Vendor / Availability */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            <div className="flex-1">
              <FieldLabel>Ingredients</FieldLabel>
              <textarea
                value={form.ingredients}
                onChange={(e) => set('ingredients', e.target.value)}
                rows={5}
                placeholder="List key ingredients separated by commas..."
                className="w-full min-h-[100px] sm:min-h-[110px] border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none focus:border-[#F97316] resize-none transition-colors"
              />
            </div>

            <div className="sm:w-[260px] lg:w-[280px] flex flex-col gap-4">
              <div>
                <FieldLabel>Vendor</FieldLabel>
                <DropDown wfull={true} icon={vendorsIcon} value={form.vendor} options={VENDORS} onChange={(v) => set('vendor', v as VendorKey)} />
              </div>
              <div>
                <FieldLabel>Availability Day</FieldLabel>
                <DropDown wfull={true} icon={calanderIcon} value={form.period} options={PERIODS} onChange={(v) => set('period', v as PeriodKey)} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-5 lg:px-7 py-4 sm:py-5 flex flex-col-reverse sm:flex-row gap-3">
        
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2.5 bg-[#FF7A00] hover:brightness-90 active:brightness-75 text-white font-bold text-[14px] sm:text-[15px] py-[13px] sm:py-[14px] rounded-xl transition-all font-[var(--font-manrope)]"
          >
            <img src={save} alt="" className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] object-contain" />
            Save Dish Details
          </button>
            <button
            type="button"
            onClick={() => setForm(EMPTY_FORM)}
            className="w-full sm:w-[120px] border border-[var(--border)] bg-[#F1F5F9] hover:bg-[var(--divider)] text-[var(--text-primary)] font-semibold text-[14px] py-[13px] sm:py-[14px] rounded-xl transition-colors font-[var(--font-manrope)]"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={qualityScore} bg="bg-[#F0FDF4]" label="Quality Score" value="High" />
        <StatCard icon={calories}     bg="bg-[#EFF6FF]" label="Est. Calories"  value="450 kcal" />
        <StatCard icon={clockOrange}  bg="bg-[#FFF7ED]" label="Prep Time"      value="20 mins" />
      </div>
    </div>
  )
}

export default AddEditDish