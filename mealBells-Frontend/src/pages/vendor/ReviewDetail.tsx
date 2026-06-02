import React from 'react';
import { 
  Star, 
  BadgeCheck, 
  Utensils, 
  CheckCircle2, 
  Package, 
  MessageCircle, 
  Flag, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const widthMap: Record<number, string> = {
  1: 'w-1/5',
  2: 'w-2/5',
  3: 'w-3/5',
  4: 'w-4/5',
  5: 'w-full',
};

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const review = {
    name: 'Alex Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    isVerified: true,
    rating: 4.5,
    dish: 'Grilled Teriyaki Salmon Bowl',
    reviewText: "The salmon was perfectly cooked and flaked apart beautifully. The teriyaki glaze had the right balance of sweet and savory without being overpowering. The only reason it's not a full 5 stars is because the rice was a bit cold on arrival, but the flavors were absolutely spot on. Will definitely order this again for my Wednesday team lunch!",
    date: 'Oct 24, 2024',
    time: '12:45 PM',
    breakdown: [
      { label: 'taste', score: 5, icon: Utensils },
      { label: 'quality', score: 4, icon: CheckCircle2 },
      { label: 'quantity', score: 5, icon: Package },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      
      {/* Back Button - Outside the card */}
      <button 
        onClick={handleBack}
        className="self-start flex items-center gap-2 mb-4 ml-10 text-sm font-semibold text-orange-600 hover:text-orange-400 p-3 bg-white rounded-xl transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-sm p-6">
        
        {/* Profile Header */}
        <div className="flex items-center gap-3 mb-5">
          <img 
            src={review.avatar} 
            alt={review.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900">{review.name}</h2>
            {review.isVerified && (
              <div className="flex items-center gap-1 mt-0.5">
                <BadgeCheck className="w-4 h-4 text-green-500 fill-green-500" />
                <span className="text-xs font-semibold text-green-600">Verified Customer</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Score + Stars */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl font-bold text-gray-900">{review.rating}</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((star) => (
              <Star 
                key={star} 
                className="w-5 h-5 text-orange-400 fill-orange-400" 
              />
            ))}
            <div className="relative w-5 h-5">
              <Star className="w-5 h-5 text-gray-200 fill-gray-200" />
              <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
                <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Meal Reviewed */}
        <div className="mb-5">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md mb-2">
            Meal Reviewed
          </span>
          <h3 className="text-base font-bold text-gray-900">{review.dish}</h3>
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 leading-relaxed italic">
            "{review.reviewText}"
          </p>
        </div>

        {/* Rating Breakdown with Progress Bars */}
        <div className="space-y-5 mb-6">
          {review.breakdown.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {item.score}/5
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-orange-500 rounded-full ${widthMap[item.score]}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Date Posted */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Posted {review.date} • {review.time}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-xl transition-colors">
            <MessageCircle className="w-4 h-4" />
            Thank User & Reply
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors shrink-0">
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;