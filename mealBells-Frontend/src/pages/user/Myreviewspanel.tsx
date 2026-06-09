import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft, ChevronRight, Star, FileText,
  TrendingUp, Award, Flame, UtensilsCrossed,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchMyReviews, resetReviewsError } from "../../slices/userSlice";
import type { Review } from "../../slices/userSlice";

const LIMIT = 9;

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} transition-colors ${s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`} />
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
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{fmtDate(review.createdAt)}</span>
        <StarRow rating={review.overallRating} />
      </div>
      <h3 className="font-bold text-gray-900 text-sm leading-snug">{dish?.name ?? "Unknown Dish"}</h3>
      {review.comment && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{review.comment}</p>
      )}
      <div className="rounded-xl overflow-hidden h-36 sm:h-40 w-full">
        {dish?.image ? (
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>
      {(review.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {review.tags!.map((t) => (
            <span key={t} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-3 py-1 rounded-full">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyReviewsPanel() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    reviewsData: data,
    loadingReviews: loading,
    reviewsError:  error,
  } = useSelector((s: RootState) => s.user);

  const page       = data?.page       ?? 1;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    dispatch(fetchMyReviews({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  const goToPage = (p: number) => dispatch(fetchMyReviews({ page: p, limit: LIMIT }));

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            My Reviews
          </h1>
        </div>

        {/* Stat cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">

            <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.totalReviews}</p>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Reviews</p>
              </div>
            </div>

            {(() => {
              const displayRating = data.avgRating > 0 ? data.avgRating : data.reviews[0]?.overallRating ?? 0;
              return (
                <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-yellow-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{displayRating || "—"}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Rating</p>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const fiveStarCount = data.reviews.filter((r) => r.overallRating === 5).length;
              const singleRating  = data.reviews[0]?.overallRating ?? 0;
              const display       = fiveStarCount > 0 ? fiveStarCount : singleRating;
              const label         = fiveStarCount > 0 ? "5★ This Page" : "Your Rating";
              return (
                <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{display}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const ratingBase = data.avgRating > 0 ? data.avgRating : data.reviews[0]?.overallRating ?? 0;
              const label  = ratingBase >= 4.5 ? "Excellent" : ratingBase >= 3.5 ? "Great" : ratingBase >= 2.5 ? "Good" : ratingBase >= 1 ? "Fair" : "—";
              const color  = ratingBase >= 4.5 ? "text-green-600"  : ratingBase >= 3.5 ? "text-blue-600"   : ratingBase >= 2.5 ? "text-yellow-600" : ratingBase >= 1 ? "text-red-500"   : "text-gray-400";
              const bg     = ratingBase >= 4.5 ? "bg-green-50"     : ratingBase >= 3.5 ? "bg-blue-50"      : ratingBase >= 2.5 ? "bg-yellow-50"    : ratingBase >= 1 ? "bg-red-50"      : "bg-gray-50";
              const icCol  = ratingBase >= 4.5 ? "text-green-500"  : ratingBase >= 3.5 ? "text-blue-500"   : ratingBase >= 2.5 ? "text-yellow-500" : ratingBase >= 1 ? "text-red-400"   : "text-gray-300";
              return (
                <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
                    <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${icCol}`} />
                  </div>
                  <div>
                    <p className={`text-lg sm:text-2xl font-bold ${color}`}>{label}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">Taste Trend</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 sm:py-32">
            <div className="w-10 h-10 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-3 text-center px-4">
            <UtensilsCrossed className="w-12 h-12 text-gray-200" />
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => { dispatch(resetReviewsError()); dispatch(fetchMyReviews({ page, limit: LIMIT })); }}
              className="text-orange-500 font-semibold text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Flame className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-800 font-semibold">No reviews yet</p>
            <p className="text-gray-400 text-sm">Rate your meals to see them here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {data.reviews.map((rv) => <ReviewCard key={rv._id} review={rv} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-orange-50 hover:border-orange-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1 sm:gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-semibold transition-all ${p === page ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-white border border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-300"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
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