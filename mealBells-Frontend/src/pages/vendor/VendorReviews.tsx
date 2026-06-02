import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, ArrowRight } from 'lucide-react';

const reviews = [
  {
    id: 1,
    initials: 'AJ',
    avatarBg: 'bg-orange-500',
    name: 'Alex J.',
    date: 'Oct 24, 2024',
    rating: 5,
    dish: 'Grilled Salmon Bowl',
    review: 'The salmon was perfectly cooked and seasoned. The portion was generous and the packaging was very clean. Will definitely order this again for lunch!',
    breakdown: { taste: 5, quantity: 5, quality: 5 },
  },
  {
    id: 2,
    initials: 'SM',
    avatarBg: 'bg-blue-500',
    name: 'Sarah M.',
    date: 'Oct 22, 2024',
    rating: 5,
    dish: 'Vegan Tofu Stir-fry',
    review: 'Best vegan lunch option in the area. The tofu had a great texture and the veggies were crisp. 10/10 recommended for busy workdays!',
    breakdown: { taste: 5, quantity: 5, quality: 5 },
  },
  {
    id: 3,
    initials: 'DK',
    avatarBg: 'bg-green-500',
    name: 'David K.',
    date: 'Oct 20, 2024',
    rating: 4,
    dish: 'Chicken Caesar Wrap',
    review: 'Tasted good but the portion was a bit smaller than expected for the price. Fast delivery though.',
    breakdown: { taste: 4, quantity: 3, quality: 4 },
  },
];

interface StarRatingProps {
  rating: number;
  size?: string;
}

const StarRating = ({ rating, size = 'w-4 h-4' }: StarRatingProps) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-orange-400 fill-orange-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

const VendorReviews = () => {
  const navigate = useNavigate();

  const handleViewDetail = (reviewId: number) => {
    navigate(`/vendor/reviews/${reviewId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start">
      <div className="w-full max-w-7xl rounded-2xl shadow-sm p-6">
        
        {/* Average Rating Header */}
        <div className="mb-6 bg-white p-5 rounded-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Average Rating
          </p>
          <div className="flex items-end gap-4 mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-gray-900">4.8</span>
              <span className="text-lg font-medium text-gray-400">/5.0</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              <StarRating rating={5} size="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Based on 28 reviews</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full transition-colors shrink-0">
            Rating (1-5)
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors shrink-0">
            Date
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors shrink-0">
            Vegetarian
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-10">
          {reviews.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100">
              
              {/* User Info Row */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${item.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <StarRating rating={item.rating} />
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-900 mb-1">{item.dish}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.review}</p>
              </div>

              {/* Rating Breakdown */}
              <div className="flex justify-between gap-4 mb-4">
                {Object.entries(item.breakdown).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 capitalize mb-1">{key}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">{value}/5</span>
                      <StarRating rating={value} size="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* View Detail Button */}
              <button
                onClick={() => handleViewDetail(item.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors border border-gray-200"
              >
                View Detail
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorReviews;