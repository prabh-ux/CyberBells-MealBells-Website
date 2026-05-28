import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import type { AxiosError } from "axios";
import {
  ChevronLeft, ChevronRight, Star, FileText,
  TrendingUp, Award, Flame, UtensilsCrossed,
} from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND as string;

interface Vendor { name: string; logo?: string }
interface DishId {
  name: string;
  image?: string;
  dishType: "Veg" | "Non-Veg";
  vendor?: Vendor;
  tags?: string[];
}
interface Review {
  _id: string;
  createdAt: string;
  overallRating: number;
  taste: number;
  quantity: number;
  quality: number;
  freshness: number;
  comment?: string;
  tags?: string[];
  dishId?: DishId;
}
interface ReviewsData {
  reviews: Review[];
  totalReviews: number;
  avgRating: number;
  page: number;
  totalPages: number;
}
interface ApiError { msg?: string }

const LIMIT = 9;

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} transition-colors ${
            s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const dish = review.dishId;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 space-y-2.5">

      {/* Row 1: Date + Stars */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{fmtDate(review.createdAt)}</span>
        <StarRow rating={review.overallRating} />
      </div>

      {/* Row 2: Dish name */}
      <h3 className="font-bold text-gray-900 text-sm leading-snug">
        {dish?.name ?? "Unknown Dish"}
      </h3>

      {/* Row 3: Comment */}
      {review.comment && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{review.comment}</p>
      )}

      {/* Row 4: Dish image */}
      <div className="rounded-xl overflow-hidden h-40 w-full">
        {dish?.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>

      {/* Row 5: Tags */}
      {(review.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {review.tags!.map((t) => (
            <span
              key={t}
              className="bg-gray-100 text-gray-600 text-[11px] font-medium px-3 py-1 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyReviewsPanel() {

  const [data, setData]       = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [page, setPage]       = useState(1);

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ success: boolean; data: ReviewsData }>(
        `${backendUrl}/user/reviews?page=${p}&limit=${LIMIT}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setData(res.data.data);
        setPage(res.data.data.page);
      } else {
        setError("Failed to load reviews.");
      }
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(
        axios.isAxiosError(e)
          ? (e.response?.data?.msg ?? `Error ${e.response?.status ?? "network"}`)
          : "Unexpected error."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(page); }, [page, fetchReviews]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">My Reviews</h1>
        </div>

        {/* ── Stat Cards ── */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            {/* Total Reviews */}
            <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalReviews}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Reviews</p>
              </div>
            </div>

            {/* Avg Rating */}
            {(() => {
              const displayRating = data.avgRating > 0
                ? data.avgRating
                : data.reviews[0]?.overallRating ?? 0;
              return (
                <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{displayRating || "—"}</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Rating</p>
                  </div>
                </div>
              );
            })()}

            {/* 5-Star count */}
            {(() => {
              const fiveStarCount = data.reviews.filter((r) => r.overallRating === 5).length;
              const singleRating  = data.reviews[0]?.overallRating ?? 0;
              const display       = fiveStarCount > 0 ? fiveStarCount : singleRating;
              const label         = fiveStarCount > 0 ? "5★ This Page" : "Your Rating";
              return (
                <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{display}</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              );
            })()}

            {/* Taste Trend */}
            {(() => {
              const ratingBase = data.avgRating > 0
                ? data.avgRating
                : data.reviews[0]?.overallRating ?? 0;
              const label =
                ratingBase >= 4.5 ? "Excellent" :
                ratingBase >= 3.5 ? "Great"     :
                ratingBase >= 2.5 ? "Good"      :
                ratingBase >= 1   ? "Fair"      : "—";
              const color =
                ratingBase >= 4.5 ? "text-green-600"  :
                ratingBase >= 3.5 ? "text-blue-600"   :
                ratingBase >= 2.5 ? "text-yellow-600" :
                ratingBase >= 1   ? "text-red-500"    : "text-gray-400";
              const bg =
                ratingBase >= 4.5 ? "bg-green-50"  :
                ratingBase >= 3.5 ? "bg-blue-50"   :
                ratingBase >= 2.5 ? "bg-yellow-50" :
                ratingBase >= 1   ? "bg-red-50"    : "bg-gray-50";
              const iconColor =
                ratingBase >= 4.5 ? "text-green-500"  :
                ratingBase >= 3.5 ? "text-blue-500"   :
                ratingBase >= 2.5 ? "text-yellow-500" :
                ratingBase >= 1   ? "text-red-400"    : "text-gray-300";
              return (
                <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
                    <TrendingUp className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${color}`}>{label}</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Taste Trend</p>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-200" />
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => fetchReviews(page)}
              className="text-orange-500 font-semibold text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Flame className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-800 font-semibold">No reviews yet</p>
            <p className="text-gray-400 text-sm">Rate your meals to see them here.</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.reviews.map((rv) => (
                <ReviewCard key={rv._id} review={rv} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-orange-50 hover:border-orange-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                        p === page
                          ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                          : "bg-white border border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-orange-50 hover:border-orange-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}