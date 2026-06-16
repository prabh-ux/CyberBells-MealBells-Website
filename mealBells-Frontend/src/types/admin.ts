import type { Dispatch, SetStateAction } from "react";

export type VendorKey = string;
export type TimeSlotKey = "Full Time" | "Breakfast" | "Lunch" | "Dinner";
export type  PeriodKey = "All Time"|"This Month" | "Last Month" | "Last 3 Month" | "This Year";

export type StatusKey = "All Status" | "Active" | "Inactive" ;
export type MealKey = "All Meals" | "BreakFast" | "Lunch" | "Dinner";
export type EditForm = { name: string; email: string; phone: string; department: string };

export interface KpiSet {
  timeliness: number;
  timelinessChange: string;
  rating: number;
  ratingReviews: number;
  accuracy: number;
  accuracyChange: string;
  quality: number;
  positives: number;
  deliveryData: { day: string; actual: number; target: number }[];
  ratingTrend: { week: string; v: number }[];
}

export interface User {
  id: string;        
  name: string;
  email: string;
  phone: string;
  department: string;
  status: "Active" | "Inactive";
  avatar: string;
}
//food wastage types 
export type FilterRow = [string, string, string[], Dispatch<SetStateAction<string>>];

export interface TooltipEntry { name: string; value: number; color: string; }

//menu overview

export type DietType = "Veg" | "Non-Veg";

export interface MenuItem {
  id:             string;
  name:           string;
  vendor:         string;
  vendorId?:      string;
  description:    string;
  ingredients?:   string;   
  
  dishType:       DietType;
  image:          string;
  imagePreview?:  string;
  icon:           string;
  availability:   string;
  createdAt:      string;
  scheduledDate?: string;
  scheduleId?:    string;
  qualityScore?:      string;
  estimatedCalories?: string;
  prepTime?:          string;
}

export interface EditModalProps {
  item:          MenuItem;
  vendorOptions: string[];
  vendorList?:   { _id?: string; id?: string; name: string }[];
  saving:        boolean;
  onSave:        (updated: MenuItem, imageFile?: File) => void;
  onClose:       () => void;
}
//menu management
export type DishType = 'Veg' | 'Non-Veg'
export type ToastType = 'success' | 'error'
export interface FormState {
  dishName:      string;
  dishType:      DishType;
  description:   string;
  ingredients:   string;
  vendor:        string;
  period:        string;
  scheduledDate: string;   
  imageFile:     File | null;
  imagePreview:  string | null;
}
export interface ToastState { visible: boolean; message: string; type: ToastType }


//vendor management 
export interface Vendor {
  _id:            string;
  vendorId:       string;
  name:           string;
  email:          string;
  phone:          string;
  capacity:       number;
  rating:         number;
  totalReviews:   number;
  status:         boolean;
  foodType:       string;
  logo:           string;
  deliveryTiming: string;
  createdAt:      string;
}

export interface EditVendorForm {
  name:           string;
  email:          string;
  phone:          string;
  capacity:       string;
  deliveryTiming: string;
  foodType:       string;
}
