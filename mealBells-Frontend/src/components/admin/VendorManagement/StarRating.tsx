import { Star } from "lucide-react";

export default function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={14} className="fill-orange-400 text-orange-400" />
      <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
    </div>
  );
}