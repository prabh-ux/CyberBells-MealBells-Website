import type { KpiSet, PeriodKey, VendorKey } from "../types/admin";
import dishTeriyaki from "../assets/dishTeriyaki.png"
import dishQuinoa   from "../assets/dishQuinoa.png";
import dishCurry    from "../assets/dishCurry.png";

export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const FEEDBACK_ROWS = [
  { date:"Oct 24, 2023", dish:"Chicken Teriyaki Bento",  image:dishTeriyaki, rating:5, complaints:"None",                    status:"On Time",       delayed:false },
  { date:"Oct 23, 2023", dish:"Superfood Quinoa Salad",  image:dishQuinoa,   rating:4, complaints:"Slightly cold on arrival", status:"Delayed (12m)", delayed:true  },
  { date:"Oct 22, 2023", dish:"Red Thai Curry",          image:dishCurry,    rating:5, complaints:"None",                    status:"On Time",       delayed:false },
  { date:"Oct 21, 2023", dish:"Chicken Teriyaki Bento",  image:dishTeriyaki, rating:4, complaints:"Missing cutlery",          status:"On Time",       delayed:false },
  { date:"Oct 20, 2023", dish:"Superfood Quinoa Salad",  image:dishQuinoa,   rating:5, complaints:"None",                    status:"On Time",       delayed:false },
  { date:"Oct 19, 2023", dish:"Red Thai Curry",          image:dishCurry,    rating:3, complaints:"Spice level off",          status:"Delayed (8m)",  delayed:true  },
];
const mkDelivery = (vals: number[]) =>
  DAYS.map((day, i) => ({ day, actual: vals[i], target: 80 }));

const mkTrend = (vals: number[]) =>
  vals.map((v, i) => ({ week: i === 0 ? "Week 1" : i === 7 ? "Week 8" : "", v }));

const mkKpi = (
  [tl, tlc, rat, rev, acc, accc, q, pos]: [number, string, number, number, number, string, number, number],
  delivery: number[],
  trend: number[]
): KpiSet => ({
  timeliness: tl, timelinessChange: tlc,
  rating: rat,    ratingReviews: rev,
  accuracy: acc,  accuracyChange: accc,
  quality: q,     positives: pos,
  deliveryData: mkDelivery(delivery),
  ratingTrend: mkTrend(trend),
});


export const DATA: Record<VendorKey, Record<PeriodKey, KpiSet>> = {
  "All Vendors": {
    "Full Time":    mkKpi([94.8,"1.2%",4.7,1248,98.2,"0.5%",88,92],[58,76,63,89,68,91,73],[58,54,96,57,61,56,59,62]),
     "Breakfast":    mkKpi([93.6,"0.8%",4.5,1102,97.7,"0.2%",85,89],[62,71,55,82,74,88,69],[52,60,88,55,58,62,57,65]),
    "Lunch":  mkKpi([92.1,"2.1%",4.4,3521,96.9,"1.1%",83,87],[55,69,72,78,60,85,66],[48,55,78,61,54,68,52,70]),
    "Dinner":      mkKpi([91.4,"3.4%",4.3,14203,95.8,"2.2%",80,85],[50,65,70,75,58,80,62],[44,50,72,58,48,64,49,66]),
  },
  "The Healthy Kitchen": {
   "Full Time":     mkKpi([97.2,"2.1%",4.9,412,99.1,"0.3%",94,96],[72,84,78,92,80,95,88],[70,75,98,72,80,74,78,82]),
     "Breakfast":     mkKpi([95.1,"1.4%",4.8,388,98.8,"0.1%",91,94],[68,79,74,88,77,91,83],[65,70,92,68,75,70,73,78]),
    "Lunch": mkKpi([94.0,"3.0%",4.7,1140,98.2,"0.8%",89,93],[65,76,70,84,74,88,80],[60,66,89,64,71,66,70,74]),
    "Dinner":     mkKpi([93.2,"4.5%",4.6,4720,97.5,"1.9%",86,91],[60,72,66,80,70,84,76],[55,62,84,60,67,62,66,70]),
  },
  "Spice Route": {
   "Full Time":   mkKpi([91.3,"0.7%",4.5,534,97.4,"0.4%",84,90],[48,66,55,80,60,84,65],[50,46,90,48,55,50,53,58]),
     "Breakfast":     mkKpi([90.5,"0.3%",4.3,498,97.0,"0.2%",82,88],[45,62,51,76,57,80,62],[46,42,86,44,51,46,49,54]),
    "Lunch": mkKpi([89.8,"1.5%",4.2,1502,96.5,"0.9%",80,86],[42,59,48,72,54,76,59],[42,38,82,40,47,42,45,50]),
   "Dinner":      mkKpi([88.9,"2.8%",4.1,6018,95.8,"1.8%",77,84],[38,55,44,68,50,72,55],[38,34,78,36,43,38,41,46]),
  },
  "Green Gourmet": {
    "Full Time":     mkKpi([96.1,"1.8%",4.8,302,98.9,"0.6%",92,95],[68,80,72,88,75,92,82],[66,70,96,68,75,70,73,78]),
     "Breakfast":  mkKpi([94.3,"1.1%",4.6,278,98.3,"0.4%",89,93],[64,76,68,84,71,88,78],[62,66,92,64,71,66,69,74]),
    "Lunch": mkKpi([93.0,"2.5%",4.5,822,97.8,"1.0%",86,91],[60,72,64,80,67,84,74],[58,62,88,60,67,62,65,70]),
  "Dinner":     mkKpi([91.8,"3.9%",4.4,3465,97.1,"2.0%",83,89],[56,68,60,76,63,80,70],[54,58,84,56,63,58,61,66]),
  },
};