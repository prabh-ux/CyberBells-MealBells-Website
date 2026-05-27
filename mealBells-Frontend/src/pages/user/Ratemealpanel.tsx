import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { AxiosError } from "axios";
import {
  ChevronLeft,
  Flame,
  UtensilsCrossed,
  Star,
  Package,
  Gem,
  Leaf,
  Smile,
  Meh,
  Frown,
  PartyPopper,
  Pencil,
  Send,
} from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND as string;

interface Dish {
  name: string;
  image: string;
  dishType: string;
  estimatedCalories?: string;
  tags?: string[];
}
interface TodayMenu {
  scheduleId: string;
  scheduledDate: string;
  dish: Dish;
  myResponse: "yes" | "no" | null;
}
interface Scores {
  taste: number;
  quantity: number;
  quality: number;
  freshness: number;
}
interface ApiError {
  msg?: string;
}
interface ExistingReview {
  _id: string;
  scheduleId: string;
  overallRating: number;
  taste: number;
  quantity: number;
  quality: number;
  freshness: number;
  comment: string;
  tags: string[];
}

const CRITERIA: {
  key: keyof Scores;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { key: "taste", label: "Taste", Icon: Smile },
  { key: "quantity", label: "Quantity", Icon: Package },
  { key: "quality", label: "Quality", Icon: Gem },
  { key: "freshness", label: "Freshness", Icon: Leaf },
];

const TAGS = [
  "Perfectly Seasoned",
  "Too Salty",
  "Great Portion",
  "Cold Food",
  "Loved It",
  "Need More Variety",
  "Fresh Ingredients",
  "Overcooked",
];

const RATING_META: Record<
  number,
  { label: string; Icon: React.FC<{ className?: string }> }
> = {
  1: { label: "Poor", Icon: Frown },
  2: { label: "Fair", Icon: Frown },
  3: { label: "Good", Icon: Meh },
  4: { label: "Great", Icon: Smile },
  5: { label: "Excellent", Icon: PartyPopper },
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`w-10 h-10 transition-colors ${
              s <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-100 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function SliderRating({
  value,
  onChange,
  Icon,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  Icon: React.FC<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Icon className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="flex-1">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(Number(e.target.value))
          }
          className="w-full h-2 accent-orange-500 cursor-pointer rounded-full"
        />
        <div className="flex justify-between text-[10px] text-gray-300 mt-0.5 px-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-orange-500">{value}</span>
      </div>
    </div>
  );
}

export default function RateMealPanel() {
  const navigate = useNavigate();

  const [menu, setMenu] = useState<TodayMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [scores, setScores] = useState<Scores>({
    taste: 3,
    quantity: 3,
    quality: 3,
    freshness: 3,
  });
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. fetch today's menu
        const menuRes = await axios.get<{ success: boolean; data: TodayMenu }>(
          `${backendUrl}/user/menu-today`,
          { withCredentials: true },
        );
        if (!menuRes.data.success) {
          setFetchError("No meal scheduled for today.");
          return;
        }
        const todayMenu = menuRes.data.data;
        setMenu(todayMenu);

        // 2. check if user already reviewed this schedule
        const reviewRes = await axios.get<{
          success: boolean;
          data: { reviews: ExistingReview[] };
        }>(`${backendUrl}/user/reviews?page=1&limit=50`, {
          withCredentials: true,
        });

        if (reviewRes.data.success) {
          const match = reviewRes.data.data.reviews.find(
            (r) => r.scheduleId === todayMenu.scheduleId,
          );
          if (match) {
            setExistingReviewId(match._id);
            setOverallRating(match.overallRating);
            setScores({
              taste: match.taste,
              quantity: match.quantity,
              quality: match.quality,
              freshness: match.freshness,
            });
            setComment(match.comment ?? "");
            setSelectedTags(match.tags ?? []);
          }
        }
      } catch (err) {
        const e = err as AxiosError<ApiError>;
        setFetchError(
          axios.isAxiosError(e)
            ? (e.response?.data?.msg ??
                `Error ${e.response?.status ?? "network"}`)
            : "Unexpected error.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const hasExistingReview = Boolean(existingReviewId);
  // form is interactive if: no prior review, OR user clicked "Edit"
  const formActive = !hasExistingReview || isEditing;

  const toggleTag = (t: string) =>
    setSelectedTags((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : [...p, t],
    );

  const handleSubmit = async () => {
    if (!overallRating || !menu || !formActive) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await axios.post<{ success: boolean }>(
        `${backendUrl}/user/review`,
        {
          scheduleId: menu.scheduleId,
          overallRating,
          ...scores,
          comment,
          tags: selectedTags,
        },
        { withCredentials: true },
      );
      if (res.data.success) {
        setSubmitted(true);
        setIsEditing(false);
      } else setSubmitError("Submission failed. Please try again.");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setSubmitError(
        axios.isAxiosError(e)
          ? (e.response?.data?.msg ?? "Submission failed.")
          : "Unexpected error.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  // ── error ────────────────────────────────────────────────────────────────
  if (fetchError || !menu)
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center gap-4 px-8 text-center">
        <UtensilsCrossed className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 text-sm">
          {fetchError || "No meal found for today."}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-orange-500 font-semibold text-sm flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );

  // ── success ──────────────────────────────────────────────────────────────
  if (submitted)
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center px-8 text-center">
        <PartyPopper className="w-16 h-16 text-orange-400 mb-5 animate-bounce" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {hasExistingReview ? "Review Updated!" : "Thank You!"}
        </h2>
        <p className="text-gray-400 mb-6">
          Your {overallRating}-star review helps us serve you better.
        </p>
        <div className="flex gap-1 justify-center mb-8">
          {Array.from({ length: overallRating }).map((_, i) => (
            <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-colors"
        >
          Done
        </button>
      </div>
    );

  const { dish } = menu;
  const ratingMeta = overallRating ? RATING_META[overallRating] : null;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Rate Your Meal
          </h1>
        </div>

        {/* Already-reviewed banner */}
        {hasExistingReview && !isEditing && (
          <div className="mb-6 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
              <p className="text-sm font-semibold text-orange-700">
                You've already reviewed this meal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors bg-white border border-orange-200 px-3 py-1.5 rounded-full"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Review
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── LEFT: Dish card ── */}
          <div className="space-y-5">
            <div className="relative rounded-[28px] overflow-hidden h-72 lg:h-96 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
              {dish.image ? (
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-white ${dish.dishType === "Veg" ? "text-green-600" : "text-red-500"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${dish.dishType === "Veg" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {dish.dishType === "Veg" ? "Vegetarian" : "Non-Veg"}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-1">
                  Today's Meal
                </p>
                <h1 className="text-white text-2xl font-bold leading-tight">
                  {dish.name}
                </h1>
              </div>
            </div>

            {(dish.estimatedCalories || dish.tags?.length) && (
              <div className="flex flex-wrap gap-2">
                {dish.estimatedCalories && (
                  <span className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-[12px] font-semibold text-gray-500 shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    {dish.estimatedCalories} kcal
                  </span>
                )}
                {dish.tags?.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="bg-orange-50 text-orange-600 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-orange-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Overall rating card */}
            <div
              className={`bg-white rounded-[24px] p-6 shadow-sm border text-center transition-all ${!formActive ? "border-gray-100 opacity-70 pointer-events-none select-none" : "border-gray-100"}`}
            >
              <p className="text-gray-400 text-sm font-medium mb-4">
                How was your overall experience?
              </p>
              <div className="flex justify-center mb-3">
                <StarRating
                  value={overallRating}
                  onChange={formActive ? setOverallRating : () => {}}
                />
              </div>
              {overallRating === 0 ? (
                <p className="text-sm text-gray-300">Tap a star to begin</p>
              ) : (
                ratingMeta && (
                  <p className="text-base font-bold text-orange-500 flex items-center justify-center gap-1.5">
                    <ratingMeta.Icon className="w-4 h-4" /> {ratingMeta.label}
                  </p>
                )
              )}
            </div>
          </div>

          {/* ── RIGHT: Review form ── */}
          <div className="space-y-5">
            {/* Aspect ratings */}
            <div
              className={`bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 transition-all ${!formActive ? "opacity-70 pointer-events-none select-none" : ""}`}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
                Rate Each Aspect
              </h3>
              <div className="space-y-5">
                {CRITERIA.map((c) => (
                  <SliderRating
                    key={c.key}
                    label={c.label}
                    Icon={c.Icon}
                    value={scores[c.key]}
                    onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div
              className={`bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 transition-all ${!formActive ? "opacity-70 pointer-events-none select-none" : ""}`}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Quick Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${selectedTags.includes(t) ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div
              className={`bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 transition-all ${!formActive ? "opacity-70 pointer-events-none select-none" : ""}`}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Share Your Thoughts
              </h3>
              <textarea
                value={comment}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setComment(e.target.value)
                }
                placeholder="What did you enjoy? Any suggestions for improvement?"
                rows={4}
                readOnly={!formActive}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none"
              />
            </div>

            {submitError && (
              <p className="text-center text-xs text-red-500">{submitError}</p>
            )}

            {/* Submit / Edit CTA */}
            {formActive ? (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || overallRating === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 transition-all text-[15px]"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {hasExistingReview ? (
                        <>
                          <Pencil className="w-4 h-4" /> Update Review
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Review
                        </>
                      )}
                    </>
                  )}
                </button>
                {overallRating === 0 && (
                  <p className="text-center text-xs text-gray-400 -mt-2">
                    Please select a star rating first
                  </p>
                )}
                {hasExistingReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    Cancel
                  </button>
                )}
              </>
            ) : (
              /* Read-only state: big edit button */
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full border-2 border-orange-400 text-orange-500 hover:bg-orange-50 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-[15px]"
              >
                <Pencil className="w-4 h-4" /> Edit Your Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
