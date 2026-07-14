import starFull from "../../../assets/starFull.png";
import starHalf from "../../../assets/starHalf.png";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[0,1,2,3,4].map(i => {
      const filled = i + 1 <= rating;
      const half   = !filled && i + 0.5 <= rating;

      if (filled) return <img key={i} src={starFull} alt="" className="w-3.5 h-3.5" />;
      if (half)   return <img key={i} src={starHalf} alt="" className="w-3.5 h-3.5" />;
      return <img key={i} src={starFull} alt="" className="w-3.5 h-3.5 opacity-25 grayscale" />;
    })}
  </div>
);

export default StarRating;