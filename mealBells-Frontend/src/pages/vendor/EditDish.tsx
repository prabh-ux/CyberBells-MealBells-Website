import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, ChevronLeft, Tag, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  fetchVendorScheduleById,
  updateVendorDish,
  createVendorDish,
  clearCurrentSchedule,
} from "../../slices/vendorSlice";
import type { AppDispatch, RootState } from "../../app/store";

const CATEGORIES   = ["Veg", "Non-Veg"] as const;
const AVAILABILITY = ["Full Time", "Breakfast", "Lunch", "Dinner"] as const;
const QUALITY_OPTS = ["High", "Medium", "Low"] as const;

export default function EditDish() {
  const navigate   = useNavigate();
  const dispatch   = useDispatch<AppDispatch>();
  const [params]   = useSearchParams();
  const fileRef    = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const scheduleId = params.get("scheduleId");
  const date       = params.get("date");
  const dayLabel   = params.get("day") ?? "This Day";
  const isEdit     = Boolean(scheduleId);

  const { currentSchedule, scheduleLoading, scheduleSaving, error } = useSelector(
    (s: RootState) => s.vendors
  );

  // ── form state ────────────────────────────────────────────────────────────
  const [imagePreview,       setImagePreview]       = useState("");
  const [imageFile,          setImageFile]          = useState<File | null>(null);
  const [name,               setName]               = useState("");
  const [category,           setCategory]           = useState<"Veg" | "Non-Veg">("Veg");
  const [description,        setDescription]        = useState("");
  const [ingredients,        setIngredients]        = useState("");
  const [availability,       setAvailability]       = useState<typeof AVAILABILITY[number]>("Full Time");
  const [estimatedCalories,  setEstimatedCalories]  = useState("450 kcal");
  const [qualityScore,       setQualityScore]       = useState<typeof QUALITY_OPTS[number]>("High");
  const [prepTime,           setPrepTime]           = useState("20 mins");
  const [protein,            setProtein]            = useState("");
  const [carbs,              setCarbs]              = useState("");
  const [tags,               setTags]               = useState<string[]>([]);
  const [tagInput,           setTagInput]           = useState("");

  // ── fetch schedule when editing ───────────────────────────────────────────
  useEffect(() => {
    if (isEdit && scheduleId) dispatch(fetchVendorScheduleById(scheduleId));
    return () => { dispatch(clearCurrentSchedule()); };
  }, [dispatch, isEdit, scheduleId]);

  // ── pre-fill form ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSchedule) return;
    const d = currentSchedule.dish as any;
    setName(d.name ?? "");
    setCategory(d.dishType ?? "Veg");
    setDescription(d.description ?? "");
    setIngredients(
      Array.isArray(d.ingredients)
        ? (d.ingredients as string[]).join(", ")
        : (d.ingredients as string) ?? ""
    );
    setImagePreview(d.image ?? "");
    setAvailability(d.availability ?? "Full Time");
    setEstimatedCalories(d.estimatedCalories ?? "450 kcal");
    setQualityScore(d.qualityScore ?? "High");
    setPrepTime(d.prepTime ?? "20 mins");
    setProtein(d.protein ?? "");
    setCarbs(d.carbs ?? "");
    setTags(Array.isArray(d.tags) ? d.tags : []);
  }, [currentSchedule]);

  // ── image ─────────────────────────────────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── tags ──────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) { toast.error("Dish name is required."); return; }

    const fd = new FormData();
    fd.append("name",              name.trim());
    fd.append("dishType",          category);
    fd.append("description",       description);
    fd.append("ingredients",       ingredients);
    fd.append("availability",      availability);
    fd.append("estimatedCalories", estimatedCalories);
    fd.append("qualityScore",      qualityScore);
    fd.append("prepTime",          prepTime);
    fd.append("protein",           protein);
    fd.append("carbs",             carbs);
    tags.forEach(t => fd.append("tags[]", t));
    if (imageFile) fd.append("image", imageFile);

    let result;
    if (isEdit && currentSchedule) {
      result = await dispatch(updateVendorDish({ dishId: currentSchedule.dish._id, formData: fd }));
    } else if (date) {
      fd.append("date", date);
      result = await dispatch(createVendorDish(fd));
    } else {
      toast.error("Missing date information."); return;
    }

    if (
      updateVendorDish.fulfilled.match(result) ||
      createVendorDish.fulfilled.match(result)
    ) {
      toast.success(isEdit ? "Dish updated!" : "Dish added to menu!");
      navigate("/vendor/menu");
    } else {
      toast.error((result.payload as string) ?? "Failed to save changes.");
    }
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (isEdit && scheduleLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <PageHeader isEdit={isEdit} dayLabel={dayLabel} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isEdit && !scheduleLoading && !currentSchedule) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <PageHeader isEdit={isEdit} dayLabel={dayLabel} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">{error ?? "Schedule not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/vendor/menu")}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? `Edit ${dayLabel}'s Dish` : `Add Dish for ${dayLabel}`}
          </h1>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Dish Image ── */}
        <div>
          <Label>Dish Image</Label>
          <div
            className="relative w-full h-44 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#EA580C] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview
              ? <img src={imagePreview} alt="Dish" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-50" />
            }
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs font-medium">
                {isEdit ? "Update dish photo" : "Add dish photo"}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </div>

        {/* ── Dish Name ── */}
        <div>
          <Label>Dish Name</Label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
            placeholder="Enter dish name"
          />
        </div>

        {/* ── Category (Veg / Non-Veg) ── */}
        <div>
          <Label>Category</Label>
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                  category === c
                    ? "border-[#EA580C] bg-orange-50 text-[#EA580C]"
                    : "border-gray-200 text-gray-500 hover:border-orange-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Availability ── */}
        <div>
          <Label>Availability</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AVAILABILITY.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAvailability(a)}
                className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                  availability === a
                    ? "border-[#EA580C] bg-orange-50 text-[#EA580C]"
                    : "border-gray-200 text-gray-500 hover:border-orange-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Quality Score */}
          <div>
            <Label>Quality Score</Label>
            <div className="flex gap-2">
              {QUALITY_OPTS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQualityScore(q)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                    qualityScore === q
                      ? "border-[#EA580C] bg-orange-50 text-[#EA580C]"
                      : "border-gray-200 text-gray-500 hover:border-orange-200"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Calories */}
          <div>
            <Label>Calories (e.g. 450 kcal)</Label>
            <input
              type="text"
              value={estimatedCalories}
              onChange={e => setEstimatedCalories(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
              placeholder="450 kcal"
            />
          </div>

          {/* Prep Time */}
          <div>
            <Label>Prep Time (e.g. 20 mins)</Label>
            <input
              type="text"
              value={prepTime}
              onChange={e => setPrepTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
              placeholder="20 mins"
            />
          </div>
        </div>

        {/* ── Nutrition row ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Protein (e.g. 32g)</Label>
            <input
              type="text"
              value={protein}
              onChange={e => setProtein(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
              placeholder="32g"
            />
          </div>
          <div>
            <Label>Carbs (e.g. 58g)</Label>
            <input
              type="text"
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
              placeholder="58g"
            />
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition resize-none"
            placeholder="Describe the dish..."
          />
        </div>

        {/* ── Ingredients ── */}
        <div>
          <Label>Ingredients</Label>
          <textarea
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition resize-none"
            placeholder="List ingredients separated by commas..."
          />
        </div>

        {/* ── Tags ── */}
        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(t => (
              <span
                key={t}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-200 text-[#EA580C] text-xs font-semibold rounded-lg"
              >
                {t}
                <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-[#EA580C] focus-within:ring-2 focus-within:ring-orange-100 transition">
              <Tag className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                className="flex-1 text-sm text-gray-800 outline-none bg-transparent"
                placeholder="Add a tag and press Enter"
              />
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSave}
            disabled={scheduleSaving}
            className="w-full py-4 rounded-xl bg-[#EA580C] text-white font-semibold text-sm hover:bg-[#c2410c] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scheduleSaving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {scheduleSaving ? "Saving..." : isEdit ? "Save Changes" : "Add to Menu"}
          </button>
          <button
            onClick={() => navigate("/vendor/menu")}
            disabled={scheduleSaving}
            className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

// ── tiny helpers ──────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-gray-700 mb-1.5">{children}</label>;
}

function PageHeader({ isEdit, dayLabel }: { isEdit: boolean; dayLabel: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? `Edit ${dayLabel}'s Dish` : `Add Dish for ${dayLabel}`}
      </h1>
    </div>
  );
}