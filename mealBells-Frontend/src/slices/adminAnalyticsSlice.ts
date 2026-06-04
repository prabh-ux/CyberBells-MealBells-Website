import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

export interface AnalyticsSummary {
  totalUsers:    number;
  totalVendors:  number;
  mealsToday:    number;
  userGrowthPct: number | null;
  attendancePct: number | null;
}
export interface MealDataPoint      { day: string; count: number; fullDate: string; }
export interface AttendanceDataPoint { day: string; present: number; gap: number; absent: number; fullDate: string; }
export interface ActivityItem { date: string; time: string; name: string; email: string; action: string; status: string; initials: string; bgColor: string; color: string; }
export interface VendorOption { label: string; value: string; }
export interface AnalyticsFilters { days: 7 | 14 | 30; department: string; vendorId: string; mealType: string; }

export const cacheKey = (f: AnalyticsFilters) =>
  `${f.days}|${f.department}|${f.vendorId}|${f.mealType}`;

const toQS = (f: AnalyticsFilters) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.department !== "all") p.set("department", f.department);
  if (f.vendorId   !== "all") p.set("vendorId",   f.vendorId);
  if (f.mealType   !== "all") p.set("mealType",   f.mealType);
  return p.toString();
};

export const DEFAULT_FILTERS: AnalyticsFilters = {
  days: 7, department: "all", vendorId: "all", mealType: "all",
};

// NOW accepts filters so summary respects department/vendor/mealType
export const fetchAnalyticsSummary = createAsyncThunk(
  "analytics/fetchSummary",
  async (filters: AnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/summary?${toQS(filters)}`);
      return data.summary as AnalyticsSummary;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch summary.");
    }
  }
);

export const fetchMealsChart = createAsyncThunk(
  "analytics/fetchMeals",
  async (filters: AnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/meals?${toQS(filters)}`);
      return { key: cacheKey(filters), data: data.data as MealDataPoint[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch meals chart.");
    }
  }
);

export const fetchAttendanceChart = createAsyncThunk(
  "analytics/fetchAttendance",
  async (filters: AnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/attendance?${toQS(filters)}`);
      return { key: cacheKey(filters), data: data.data as AttendanceDataPoint[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch attendance chart.");
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  "analytics/fetchActivity",
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/activity?limit=${limit}`);
      return data.activities as ActivityItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch activity.");
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  "analytics/fetchFilterOptions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/analytics/filter-options");
      return data.vendors as VendorOption[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch filter options.");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    filters: DEFAULT_FILTERS as AnalyticsFilters,
    vendorOptions: [] as VendorOption[],
    filterOptionsLoading: false,
    summary: null as AnalyticsSummary | null,
    summaryLoading: false,
    mealsChart: {} as Record<string, MealDataPoint[]>,
    mealsLoading: false,
    mealsError: null as string | null,
    attendanceChart: {} as Record<string, AttendanceDataPoint[]>,
    attendanceLoading: false,
    attendanceError: null as string | null,
    activities: [] as ActivityItem[],
    activitiesLoading: false,
    activitiesError: null as string | null,
    error: null as string | null,
  },
  reducers: {
    setFilters(state, { payload }: { payload: Partial<AnalyticsFilters> }) {
      state.filters = { ...state.filters, ...payload };
    },
    resetFilters(state) {
      state.filters = { ...DEFAULT_FILTERS };
    },
    clearAnalyticsErrors(state) {
      state.error = null; state.mealsError = null;
      state.attendanceError = null; state.activitiesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilterOptions.pending,   (s) => { s.filterOptionsLoading = true; })
      .addCase(fetchFilterOptions.fulfilled, (s, { payload }) => { s.filterOptionsLoading = false; s.vendorOptions = payload; })
      .addCase(fetchFilterOptions.rejected,  (s) => { s.filterOptionsLoading = false; });
    builder
      .addCase(fetchAnalyticsSummary.pending,   (s) => { s.summaryLoading = true;  s.error = null; })
      .addCase(fetchAnalyticsSummary.fulfilled, (s, { payload }) => { s.summaryLoading = false; s.summary = payload; })
      .addCase(fetchAnalyticsSummary.rejected,  (s, { payload }) => { s.summaryLoading = false; s.error = payload as string; });
    builder
      .addCase(fetchMealsChart.pending,   (s) => { s.mealsLoading = true;  s.mealsError = null; })
      .addCase(fetchMealsChart.fulfilled, (s, { payload }) => { s.mealsLoading = false; s.mealsChart[payload.key] = payload.data; })
      .addCase(fetchMealsChart.rejected,  (s, { payload }) => { s.mealsLoading = false; s.mealsError = payload as string; });
    builder
      .addCase(fetchAttendanceChart.pending,   (s) => { s.attendanceLoading = true;  s.attendanceError = null; })
      .addCase(fetchAttendanceChart.fulfilled, (s, { payload }) => { s.attendanceLoading = false; s.attendanceChart[payload.key] = payload.data; })
      .addCase(fetchAttendanceChart.rejected,  (s, { payload }) => { s.attendanceLoading = false; s.attendanceError = payload as string; });
    builder
      .addCase(fetchRecentActivity.pending,   (s) => { s.activitiesLoading = true;  s.activitiesError = null; })
      .addCase(fetchRecentActivity.fulfilled, (s, { payload }) => { s.activitiesLoading = false; s.activities = payload; })
      .addCase(fetchRecentActivity.rejected,  (s, { payload }) => { s.activitiesLoading = false; s.activitiesError = payload as string; });
  },
});

export const { setFilters, resetFilters, clearAnalyticsErrors } = analyticsSlice.actions;
export default analyticsSlice.reducer;