import starFull     from "../../../assets/starFull.png";
import starHalf     from "../../../assets/starHalf.png";
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[0,1,2,3,4].map(i => (
      <img key={i} src={i < rating ? starFull : starHalf} alt="" className="w-3.5 h-3.5" />
    ))}
  </div>
);

export default StarRating