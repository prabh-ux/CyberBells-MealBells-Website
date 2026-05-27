// pages/admin/AddEditDish.tsx
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch, useSelector }  from 'react-redux'
import { useParams, useNavigate }    from 'react-router-dom'
import type { AppDispatch, RootState } from '../../app/store'
import {
  addDishWithSchedule, updateDish,
  fetchDishById, resetDishState, clearEditingDish,
} from '../../slices/dishSlice'
import { fetchVendors } from '../../slices/vendorSlice'
import toast            from 'react-hot-toast'

import cutleryIcon      from '../../assets/cutlerryGray.png'
import menuItem2Icon    from '../../assets/menuItem2Icon.png'
import nonvegIcon       from '../../assets/nonvegIcon.png'
import vendorsIcon      from '../../assets/vendorGray.png'
import calanderIcon     from '../../assets/calanderGray.png'
import uploadIconOrange from '../../assets/uploadIconOrange.png'
import save             from '../../assets/save.png'
import clockOrange      from '../../assets/clock-orange.png'
import qualityScoreIcon from '../../assets/quality-score.png'
import caloriesIcon     from '../../assets/calories.png'

import DropDown   from '../../components/shared/DropDown'
import StatCard   from '../../components/admin/AddEditDish/StatCard'
import FieldLabel from '../../components/admin/AddEditDish/FieldLabel'
import { TIME_SLOTS } from '../../data/MenuOverview'

import type { DishType, FormState, PeriodKey, VendorKey } from '../../types/admin'

type ErrorFields = Partial<Record<'dishName' | 'vendor', string>>

interface StatState {
  qualityScore:      string
  estimatedCalories: string
  prepTime:          string
}

const DEFAULT_STATS: StatState = {
  qualityScore:      'High',
  estimatedCalories: '450 kcal',
  prepTime:          '20 mins',
}

const EMPTY_FORM: FormState = {
  dishName:      '',
  dishType:      'Veg',
  description:   '',
  ingredients:   '',
  vendor:        'All Vendors',
  period:        'Full Time',
  scheduledDate: '',
  imageFile:     null,
  imagePreview:  null,
}

const AddEditDish = () => {
  const dispatch  = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const { id }    = useParams<{ id?: string }>()  
  const isEdit    = Boolean(id)

  const { saving, error, editingDish, loadingOne } = useSelector((s: RootState) => s.dishes)
  const { list: vendorList }                       = useSelector((s: RootState) => s.vendors)

  const [form,        setForm]        = useState<FormState>(EMPTY_FORM)
  const [stats,       setStats]       = useState<StatState>(DEFAULT_STATS)
  const [dragOver,    setDragOver]    = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ErrorFields>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevSaving   = useRef(false)
  const todayStr     = new Date().toISOString().split('T')[0]

  // ── fetch vendors ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!vendorList.length) dispatch(fetchVendors())
  }, [dispatch, vendorList.length])

  // ── if edit mode, fetch dish ──────────────────────────────────────────────
  useEffect(() => {
    if (isEdit && id) dispatch(fetchDishById(id))
  }, [dispatch, id, isEdit])

  // ── populate form when editingDish loads ──────────────────────────────────
  useEffect(() => {
    if (!editingDish) return

    setForm({
      dishName:      editingDish.name        ?? '',
      dishType:      (editingDish.dishType   as DishType) ?? 'Veg',
      description:   editingDish.description ?? '',
      ingredients:   editingDish.ingredients ?? '',
      vendor:        editingDish.vendor      ?? 'All Vendors',
      period:        editingDish.availability ?? 'Full Time',
      scheduledDate: editingDish.scheduledDate
        ? new Date(editingDish.scheduledDate).toISOString().split('T')[0]
        : '',
      imageFile:     null,
      imagePreview:  editingDish.image ?? null,
    })

    setStats({
      qualityScore:      editingDish.qualityScore      ?? 'High',
      estimatedCalories: editingDish.estimatedCalories ?? '450 kcal',
      prepTime:          editingDish.prepTime          ?? '20 mins',
    })
  }, [editingDish])

  // ── cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      dispatch(resetDishState())
      dispatch(clearEditingDish())
    }
  }, [dispatch])

  // ── react to save completing ──────────────────────────────────────────────
  useEffect(() => {
    if (prevSaving.current && !saving) {
      if (!error) {
        toast.success(isEdit ? 'Dish updated successfully!' : 'Dish saved successfully!')
        if (isEdit) {
          navigate('/admin/menu-overview')   // go back after edit
        } else {
          setForm(EMPTY_FORM)
          setStats(DEFAULT_STATS)
          setFieldErrors({})
        }
      } else {
        toast.error(error)
      }
    }
    prevSaving.current = saving
  }, [saving, error, isEdit, navigate])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const setStat = (key: keyof StatState, value: string) =>
    setStats(prev => ({ ...prev, [key]: value }))

  const clearFieldError = (field: keyof ErrorFields) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/) || file.size > 5 * 1024 * 1024) return
    setForm(p => ({ ...p, imageFile: file, imagePreview: URL.createObjectURL(file) }))
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isFormReady = useMemo(() =>
    form.dishName.trim().length > 0 && form.vendor !== 'All Vendors',
  [form.dishName, form.vendor])

  const isSaveDisabled = !isFormReady || saving

  const fieldBorder = (field: keyof ErrorFields) =>
    fieldErrors[field]
      ? 'border-red-400 bg-red-50 focus-within:border-red-500'
      : 'border-[#E0C0AF] focus-within:border-[#F97316]'

  const handleSave = () => {
    if (saving) return

    const errors: ErrorFields = {}
    if (!form.dishName.trim())                         errors.dishName = 'Dish name is required'
    if (!form.vendor || form.vendor === 'All Vendors') errors.vendor   = 'Please select a vendor'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }

    setFieldErrors({})

    const selectedVendorId = vendorList.find(v => v.name === form.vendor)?._id
      ?? editingDish?.vendorId   // fallback to existing vendorId in edit mode
      ?? ''

    const payload = new FormData()
    payload.append('name',              form.dishName.trim())
    payload.append('dishType',          form.dishType)
    payload.append('description',       form.description)
    payload.append('ingredients',       form.ingredients)
    payload.append('vendor',            selectedVendorId)
    payload.append('availability',      form.period)
    payload.append('qualityScore',      stats.qualityScore)
    payload.append('estimatedCalories', stats.estimatedCalories)
    payload.append('prepTime',          stats.prepTime)
    if (form.scheduledDate) payload.append('scheduledDate', form.scheduledDate)
    if (form.imageFile)     payload.append('image', form.imageFile)

    if (isEdit && id) {
      dispatch(updateDish({ id, formData: payload }))
    } else {
      dispatch(addDishWithSchedule(payload))
    }
  }

  const vendorNames = ['All Vendors', ...vendorList.map(v => v.name)]

  // ── loading skeleton for edit mode ────────────────────────────────────────
  if (isEdit && loadingOne) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="bg-white rounded-2xl shadow-sm p-7 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-[var(--font-manrope)] px-3 sm:px-6 lg:px-8 py-5 sm:py-10">

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[var(--text-primary)] tracking-tight">
            {isEdit ? 'Edit Dish' : 'Add Dish'}
          </h1>
          <p className="text-[13px] sm:text-[15px] text-[var(--text-label)] font-[var(--font-inter)] mt-0.5 sm:mt-1">
            {isEdit ? 'Update dish details and schedule.' : 'Configure dish details, dietary preferences, and availability.'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-[var(--font-inter)] mt-1.5">
          <span className="text-[var(--text-label)]">Dashboard</span>
          <span className="text-[var(--text-label)]">/</span>
          {isEdit && (
            <>
              <button
                onClick={() => navigate('/admin/menu-overview')}
                className="text-[var(--text-label)] hover:text-[var(--text-primary)]"
              >
                Menu Overview
              </button>
              <span className="text-[var(--text-label)]">/</span>
            </>
          )}
          <span className="font-semibold text-[#EA580C]">
            {isEdit ? 'Edit Dish' : 'Manage Dishes'}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-5">
        <div className="p-4 sm:p-5 lg:p-7">

          {/* Dish Name + Dish Type */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div className="flex-1">
              <FieldLabel required>Dish Name</FieldLabel>
              <div className={`flex items-center gap-3 border rounded-xl px-3 sm:px-4 py-[11px] transition-colors ${fieldBorder('dishName')}`}>
                <img src={cutleryIcon} alt="" className="w-[15px] h-[15px] object-contain shrink-0" />
                <input
                  type="text"
                  value={form.dishName}
                  onChange={e => { set('dishName', e.target.value); clearFieldError('dishName') }}
                  placeholder="e.g. Grilled Mediterranean Salmon"
                  className="flex-1 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none bg-transparent"
                />
              </div>
              {fieldErrors.dishName && (
                <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.dishName}</p>
              )}
            </div>

            <div className="sm:w-[260px] lg:w-[280px]">
              <FieldLabel>Dish Type</FieldLabel>
              <div className="flex gap-2 sm:gap-3">
                {(['Veg', 'Non-Veg'] as DishType[]).map(type => (
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
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Briefly describe the dish's flavor profile, portion size, and presentation..."
              className="w-full border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none focus:border-[#F97316] resize-none transition-colors"
            />
          </div>

          {/* Image */}
          <div className="mb-5 sm:mb-6">
            <FieldLabel>Dish Image</FieldLabel>
            {form.imagePreview ? (
              <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border)]">
                <img src={form.imagePreview} alt="Dish preview" className="w-full h-[160px] sm:h-[200px] object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, imageFile: null, imagePreview: null }))}
                  className="absolute top-3 right-3 bg-white border border-[var(--border)] text-[var(--text-label)] font-[var(--font-inter)] text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--page-bg)] transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
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
                    {isEdit ? 'Upload new image (optional)' : 'Drag and drop dish photo here'}
                  </p>
                  <p className="text-[12px] sm:text-[14px] text-[#64748B] font-[var(--font-inter)] mt-1">
                    Supported formats: JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              className="hidden"
            />
          </div>

          {/* Ingredients + right column */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
            <div className="flex-1">
              <FieldLabel>Ingredients</FieldLabel>
              <textarea
                value={form.ingredients}
                onChange={e => set('ingredients', e.target.value)}
                rows={5}
                placeholder="List key ingredients separated by commas..."
                className="w-full min-h-[100px] sm:min-h-[110px] border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] text-[var(--text-primary)] font-[var(--font-inter)] placeholder:text-[#6B7280] focus:outline-none focus:border-[#F97316] resize-none transition-colors"
              />
            </div>

            <div className="sm:w-[260px] lg:w-[280px] flex flex-col gap-4">
              <div>
                <FieldLabel required>Vendor</FieldLabel>
                <div className={`rounded-xl border transition-colors ${
                  fieldErrors.vendor ? 'border-red-400 bg-red-50' : 'border-transparent'
                }`}>
                  <DropDown
                    wfull
                    icon={vendorsIcon}
                    value={form.vendor}
                    options={vendorNames}
                    onChange={v => { set('vendor', v as VendorKey); clearFieldError('vendor') }}
                  />
                </div>
                {fieldErrors.vendor && (
                  <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.vendor}</p>
                )}
              </div>

              <div>
                <FieldLabel>Availability</FieldLabel>
                <DropDown
                  wfull
                  icon={calanderIcon}
                  value={form.period}
                  options={TIME_SLOTS}
                  onChange={v => set('period', v as PeriodKey)}
                />
              </div>

              <div>
                <FieldLabel>
                  Schedule Date{' '}
                  <span className="text-[11px] text-[var(--text-label)] font-normal">(optional)</span>
                </FieldLabel>
                <div className="flex items-center gap-3 border border-[#E0C0AF] rounded-xl px-3 sm:px-4 py-[11px] focus-within:border-[#F97316] transition-colors">
                  <img src={calanderIcon} alt="" className="w-[15px] h-[15px] object-contain shrink-0" />
                  <input
                    type="date"
                    min={todayStr}
                    value={form.scheduledDate}
                    onChange={e => set('scheduledDate', e.target.value)}
                    className="flex-1 text-[14px] text-[var(--text-primary)] font-[var(--font-inter)] focus:outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-label)] mt-1">
                  Pick a date to show this dish on the user's home screen
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="px-4 sm:px-5 lg:px-7 pb-2 text-xs text-gray-400">
          <span className="text-red-400">*</span> Required fields
        </p>

        <div className="px-4 sm:px-5 lg:px-7 py-4 sm:py-5 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`flex-1 flex items-center justify-center gap-2.5 text-white font-bold text-[14px] sm:text-[15px] py-[13px] sm:py-[14px] rounded-xl transition-all font-[var(--font-manrope)] ${
              isSaveDisabled
                ? 'bg-[#FF7A00] opacity-50 cursor-not-allowed'
                : 'bg-[#FF7A00] hover:brightness-90 active:brightness-75'
            }`}
          >
            <img src={save} alt="" className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] object-contain" />
            {saving ? 'Saving...' : isEdit ? 'Update Dish' : 'Save Dish Details'}
          </button>
          <button
            type="button"
            onClick={() => isEdit ? navigate('/admin/menu-overview') : (setForm(EMPTY_FORM), setStats(DEFAULT_STATS), setFieldErrors({}))}
            disabled={saving}
            className="w-full sm:w-[120px] border border-[var(--border)] bg-[#F1F5F9] hover:bg-[var(--divider)] disabled:opacity-60 text-[var(--text-primary)] font-semibold text-[14px] py-[13px] sm:py-[14px] rounded-xl transition-colors font-[var(--font-manrope)]"
          >
            {isEdit ? 'Back' : 'Cancel'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={qualityScoreIcon} bg="bg-[#F0FDF4]" label="Quality Score"  value={stats.qualityScore}      onChange={v => setStat('qualityScore', v)}      />
        <StatCard icon={caloriesIcon}     bg="bg-[#EFF6FF]" label="Est. Calories"  value={stats.estimatedCalories} onChange={v => setStat('estimatedCalories', v)} />
        <StatCard icon={clockOrange}      bg="bg-[#FFF7ED]" label="Prep Time"      value={stats.prepTime}          onChange={v => setStat('prepTime', v)}          />
      </div>
    </div>
  )
}

export default AddEditDish