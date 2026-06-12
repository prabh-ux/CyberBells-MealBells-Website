import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Star, ArrowRight, Loader2 } from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchVendorReviews } from "../../slices/vendorSlice";
import DropDown from "../../components/shared/DropDown";

const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`${size} ${star <= Math.round(rating) ? "text-orange-400 fill-orange-400" : "text-gray-200 fill-gray-200"}`} />
    ))}
  </div>
);

const avatarBg = (name: string) => {
  const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
};

const initials = (name: string) =>
  name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "??";

const RATING_OPTIONS = ["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"];
const DATE_OPTIONS   = ["All", "Newest First", "Oldest First"];
const TYPE_OPTIONS   = ["All", "Veg", "Non-Veg"];

const VendorReviews = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { reviewsData, reviewsLoading, reviewsError, activeOrgId } = useSelector((s: RootState) => s.vendors);

  const [ratingFilter, setRatingFilter] = useState("All");
  const [dateFilter,   setDateFilter]   = useState("All");
  const [typeFilter,   setTypeFilter]   = useState("All");

  // ✅ refetch whenever the active org changes, and scope the request to it
  useEffect(() => {
    if (activeOrgId) dispatch(fetchVendorReviews({ page: 1, limit: 50, orgId: activeOrgId }));
  }, [dispatch, activeOrgId]);

  const filteredReviews = useMemo(() => {
    let list = reviewsData?.reviews ?? [];
    if (ratingFilter !== "All") {
      const target = parseInt(ratingFilter);
      list = list.filter((r) => Math.round(r.overallRating) === target);
    }
    if (typeFilter !== "All") list = list.filter((r) => r.dishId?.dishType === typeFilter);
    if (dateFilter === "Newest First")
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (dateFilter === "Oldest First")
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }, [reviewsData, ratingFilter, dateFilter, typeFilter]);

  if (reviewsLoading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

  if (reviewsError)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-gray-500 font-medium mb-3">{reviewsError}</p>
          <button
            onClick={() => activeOrgId && dispatch(fetchVendorReviews({ page: 1, limit: 50, orgId: activeOrgId }))}
            className="text-sm text-orange-500 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const summary = reviewsData?.summary;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto rounded-2xl shadow-sm p-4 sm:p-6">

        {/* Average Rating Header */}
        <div className="mb-5 sm:mb-6 bg-white p-4 sm:p-5 rounded-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Average Rating
          </p>
          <div className="flex items-end gap-3 sm:gap-4 mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold text-gray-900">{summary?.avgRating ?? "—"}</span>
              <span className="text-base sm:text-lg font-medium text-gray-400">/5.0</span>
            </div>
            <div className="flex gap-0.5 mb-1.5 sm:mb-2">
              <StarRating rating={summary?.avgRating ?? 0} size="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Based on {summary?.totalReviews ?? 0} reviews</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 mb-5 sm:mb-6 flex-wrap">
          <div className="w-[130px] sm:min-w-[140px]">
            <DropDown
              placeholder="Rating (1–5)"
              value={ratingFilter === "All" ? "" : ratingFilter}
              options={RATING_OPTIONS}
              onChange={(v) => setRatingFilter(v)}
            />
          </div>
          <div className="w-[120px] sm:min-w-[140px]">
            <DropDown
              placeholder="Date"
              value={dateFilter === "All" ? "" : dateFilter}
              options={DATE_OPTIONS}
              onChange={(v) => setDateFilter(v)}
            />
          </div>
          <div className="w-[120px] sm:min-w-[140px]">
            <DropDown
              placeholder="Dish Type"
              value={typeFilter === "All" ? "" : typeFilter}
              options={TYPE_OPTIONS}
              onChange={(v) => setTypeFilter(v)}
            />
          </div>
          {(ratingFilter !== "All" || dateFilter !== "All" || typeFilter !== "All") && (
            <button
              onClick={() => { setRatingFilter("All"); setDateFilter("All"); setTypeFilter("All"); }}
              className="px-3 sm:px-4 py-[10px] text-xs sm:text-sm font-medium text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredReviews.length === 0 && (
          <div className="bg-white rounded-xl p-8 sm:p-10 text-center text-gray-400 text-sm font-medium">
            No reviews match the selected filters.
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-3 sm:space-y-4">
          {filteredReviews.map((item) => {
            const userName = item.userId?.name ?? "Anonymous";
            const date = new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div key={item._id} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100">

                {/* User Info Row */}
                <div className="flex items-start gap-3 mb-3">
                  {item.userId?.avatar ? (
                    <img src={item.userId.avatar} alt={userName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${avatarBg(userName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {initials(userName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{userName}</h3>
                      <span className="text-[11px] sm:text-xs text-gray-400 shrink-0">{date}</span>
                    </div>
                    <StarRating rating={item.overallRating} size="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{item.dishId?.name ?? ""}</h4>
                  {item.comment && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {item.comment}
                    </p>
                  )}
                </div>

                {/* Rating Breakdown */}
                <div className="flex justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  {([
                    { key: "taste",    value: item.taste    },
                    { key: "quantity", value: item.quantity },
                    { key: "quality",  value: item.quality  },
                  ] as const).map(({ key, value }) => (
                    <div key={key}>
                      <p className="text-[10px] sm:text-xs text-gray-400 capitalize mb-1">{key}</p>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">{value}/10</span>
                        <StarRating rating={Math.round(value / 2)} size="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* View Detail */}
                <button
                  onClick={() => navigate(`/vendor/reviews/${item._id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  View Detail
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VendorReviews;