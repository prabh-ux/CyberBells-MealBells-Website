import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorTodayMenu, updateTodayDish } from "../../slices/vendorSlice"; 
import type { AppDispatch, RootState } from "../../app/store"; 
const CATEGORIES = ["Veg", "Non-Veg", "Vegan"];

export default function EditDish() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
  const fileRef   = useRef<HTMLInputElement>(null);

  const { todayMenu, menuLoading, error } = useSelector(
    (s: RootState) => s.vendors
  );

  // ── Local form state ───────────────────────────────────────────────────────
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [name,         setName]         = useState("");
  const [category,     setCategory]     = useState("Veg");
  const [description,  setDescription]  = useState("");
  const [ingredients,  setIngredients]  = useState("");
  const [calories,     setCalories]     = useState("");
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);

  // ── Fetch if not already loaded ────────────────────────────────────────────
  useEffect(() => {
    if (!todayMenu) dispatch(fetchVendorTodayMenu());
  }, [dispatch, todayMenu]);

  // ── Pre-fill form once data arrives ───────────────────────────────────────
  useEffect(() => {
    if (!todayMenu) return;
    const d = todayMenu.dish;
    setName(d.name ?? "");
    setCategory(d.dishType ?? "Veg");
    setDescription(d.description ?? "");
    setCalories(d.estimatedCalories ?? "");
    setImagePreview(d.image ?? "");

    // ingredients may be a comma string or array
    setIngredients(
      Array.isArray(d.ingredients)
        ? d.ingredients.join(", ")
        : d.ingredients ?? ""
    );
  }, [todayMenu]);

  // ── Image picker ───────────────────────────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);

    const formData = new FormData();
    formData.append("name",               name);
    formData.append("dishType",           category);
    formData.append("description",        description);
    formData.append("ingredients",        ingredients);
    formData.append("estimatedCalories",  calories);
    if (imageFile) formData.append("image", imageFile);

    const result = await dispatch(updateTodayDish(formData));

    setSaving(false);

    if (updateTodayDish.fulfilled.match(result)) {
      navigate("/vendor/menu");
    } else {
      setSaveError((result.payload as string) ?? "Failed to save changes.");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (menuLoading && !todayMenu) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Edit Today's Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── No menu scheduled ─────────────────────────────────────────────────────
  if (!menuLoading && !todayMenu) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Edit Today's Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">{error ?? "No dish scheduled for today."}</p>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
        <h1 className="text-2xl font-bold text-gray-900">Edit Today's Menu</h1>
      </div>

      <div className="space-y-5">

        {/* Dish Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dish Image</label>
          <div
            className="relative w-full h-44 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#EA580C] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Dish" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-50" />
            )}
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Update dish photo</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
            />
          </div>
        </div>

        {/* Dish Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dish Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
            placeholder="Enter dish name"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition bg-white pr-8"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
          </div>
        </div>

        {/* Calories */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Calories (kcal)</label>
          <input
            type="text"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition"
            placeholder="e.g. 430"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition resize-none"
            placeholder="Describe the dish..."
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ingredients</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100 transition resize-none"
            placeholder="List ingredients separated by commas..."
          />
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-sm text-red-500 text-center">{saveError}</p>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-[#EA580C] text-white font-semibold text-sm hover:bg-[#c2410c] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => navigate("/vendor/menu")}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}