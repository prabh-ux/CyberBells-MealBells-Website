

export const VENDORS      = ["All Vendors", "The Healthy Kitchen", "Spice Route", "Green Gourmet"];
export const VENDOR_OPTIONS = VENDORS.filter(v => v !== "All Vendors");
export const PERIODS      = ["This Month", "Last Month", "Last 3 Months", "This Year"];
export const TIME_SLOTS = ["Full Time", "Breakfast", "Lunch", "Dinner"];
export const DIET_TYPES   = ["VEG", "NON-VEG"];
export const TABS         = ["Today", "Weekly", "Monthly"] as const;
