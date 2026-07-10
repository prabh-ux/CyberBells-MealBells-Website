import {
  Star, BadgeCheck, Utensils, CheckCircle2, Package,
  Droplets, MessageCircle, Flag, Clock, ArrowLeft, Loader2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

const StarRow = ({ rating }: { rating: number }) => {
  const full    = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty   = 5 - full - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 fill-orange-400" />
      ))}
      {hasHalf && (
        <div className="relative w-4 h-4 sm:w-5 sm:h-5">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200 fill-gray-200" />
          <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 fill-orange-400" />
          </div>
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200 fill-gray-200" />
      ))}
    </div>
  );
};

const avatarBg = (name: string) => {
  const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
};

const initials = (name: string) =>
  name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "??";

const ReviewDetail = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reviewsData, reviewsLoading } = useSelector((s: RootState) => s.vendors);
  const review = reviewsData?.reviews.find((r) => r._id === id);

  if (reviewsLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

  if (!review)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
        <p className="text-gray-500 font-medium">Review not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-orange-500 underline">Go back</button>
      </div>
    );

  const userName = review.userId?.name ?? "Anonymous";
  const avatar   = review.userId?.avatar;
  const postedAt = new Date(review.createdAt);
  const dateStr  = postedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr  = postedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const breakdown = [
    { label: "taste",     score: review.taste,     icon: Utensils    },
    { label: "quality",   score: review.quality,   icon: CheckCircle2 },
    { label: "quantity",  score: review.quantity,  icon: Package     },
    { label: "freshness", score: review.freshness, icon: Droplets    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* Back button */}
      <div className="max-w-7xl mx-auto mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-400 p-2.5 sm:p-3 bg-white rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-4 sm:p-6">

        {/* Profile Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          {avatar ? (
            <img src={avatar} alt={userName} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${avatarBg(userName)} flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0`}>
              {initials(userName)}
            </div>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{userName}</h2>
            {review.userId && (
              <div className="flex items-center gap-1 mt-0.5">
                <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 fill-green-500" />
                <span className="text-xs font-semibold text-green-600">Verified Customer</span>
              </div>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
          <span className="text-3xl sm:text-4xl font-bold text-gray-900">{review.overallRating}</span>
          <StarRow rating={review.overallRating} />
        </div>

        {/* Meal Reviewed */}
        {review.dishId && (
          <div className="mb-4 sm:mb-5">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md mb-2">
              Meal Reviewed
            </span>
            <div className="flex items-center gap-3">
              {review.dishId.image && (
                <img src={review.dishId.image} alt={review.dishId.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0" />
              )}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{review.dishId.name}</h3>
                {review.dishId.dishType && (
                  <span className="text-xs text-gray-400">{review.dishId.dishType}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Text */}
        {review.comment && (
          <div className="mb-5 sm:mb-6">
            <p className="text-sm text-gray-500 leading-relaxed italic">"{review.comment}"</p>
          </div>
        )}

        {/* Tags */}
        {review.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
            {review.tags.map((tag) => (
              <span key={tag} className="px-2.5 sm:px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full border border-orange-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating Breakdown */}
        <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6">
          {breakdown.map(({ label, score, icon: Icon }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-700 capitalize">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{score}/5</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(score / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Date Posted */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 sm:mb-6">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Posted {dateStr} • {timeStr}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-xl transition-colors">
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Thank User &amp; Reply</span>
            <span className="sm:hidden">Reply</span>
          </button>
          <button className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors shrink-0">
            <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;