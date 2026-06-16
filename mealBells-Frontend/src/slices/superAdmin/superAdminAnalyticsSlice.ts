import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalUsers:    number;
  totalVendors:  number;
  mealsToday:    number;
  userGrowthPct: number | null;
  attendancePct: number | null;
}

export interface MealDataPoint       { day: string; count: number; fullDate: string; }
export interface AttendanceDataPoint { day: string; present: number; gap: number; absent: number; fullDate: string; }
export interface ActivityItem {
  date: string; time: string; name: string; email: string;
  action: string; status: string; initials: string; bgColor: string; color: string;
}
export interface VendorOption { label: string; value: string; }
export interface OrgOption    { label: string; value: string; }

export interface SuperAnalyticsFilters {
  days:     7 | 14 | 30;
  orgId:    string;          // "all" | "<objectId>"
  department: string;
  vendorId:   string;
  mealType:   string;
}

export const DEFAULT_SUPER_FILTERS: SuperAnalyticsFilters = {
  days: 7, orgId: "all", department: "all", vendorId: "all", mealType: "all",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const superCacheKey = (f: SuperAnalyticsFilters) =>
  `${f.days}|${f.orgId}|${f.department}|${f.vendorId}|${f.mealType}`;

const toQS = (f: SuperAnalyticsFilters) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.orgId       !== "all") p.set("orgId",      f.orgId);
  if (f.department  !== "all") p.set("department", f.department);
  if (f.vendorId    !== "all") p.set("vendorId",   f.vendorId);
  if (f.mealType    !== "all") p.set("mealType",   f.mealType);
  return p.toString();
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperAnalyticsSummary = createAsyncThunk(
  "superAnalytics/fetchSummary",
  async (filters: SuperAnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/analytics/summary?${toQS(filters)}`);
      return data.summary as AnalyticsSummary;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch summary.");
    }
  }
);

export const fetchSuperMealsChart = createAsyncThunk(
  "superAnalytics/fetchMeals",
  async (filters: SuperAnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/analytics/meals?${toQS(filters)}`);
      return { key: superCacheKey(filters), data: data.data as MealDataPoint[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch meals chart.");
    }
  }
);

export const fetchSuperAttendanceChart = createAsyncThunk(
  "superAnalytics/fetchAttendance",
  async (filters: SuperAnalyticsFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/analytics/attendance?${toQS(filters)}`);
      return { key: superCacheKey(filters), data: data.data as AttendanceDataPoint[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch attendance chart.");
    }
  }
);

export const fetchSuperRecentActivity = createAsyncThunk(
  "superAnalytics/fetchActivity",
  async ({ limit, orgId }: { limit?: number; orgId: string }, { rejectWithValue }) => {
    try {
      const p = new URLSearchParams({ limit: String(limit ?? 50) });
      if (orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/analytics/activity?${p}`);
      return data.activities as ActivityItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch activity.");
    }
  }
);

export const fetchSuperOrgOptions = createAsyncThunk(
  "superAnalytics/fetchOrgOptions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/super-admin/analytics/org-options");
      return data.orgs as OrgOption[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch org options.");
    }
  }
);

export const fetchSuperFilterOptions = createAsyncThunk(
  "superAnalytics/fetchFilterOptions",
  async (orgId: string = "all", { rejectWithValue }) => {
    try {
      const p = new URLSearchParams();
      if (orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/analytics/filter-options?${p}`);
      return data.vendors as VendorOption[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch filter options.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superAnalyticsSlice = createSlice({
  name: "superAnalytics",
  initialState: {
    filters: DEFAULT_SUPER_FILTERS as SuperAnalyticsFilters,

    // Org options for header dropdown
    orgOptions:        [] as OrgOption[],
    orgOptionsLoading: false,

    // Vendor options for the analytics filter dropdown (scoped by orgId)
    vendorOptions:        [] as VendorOption[],
    filterOptionsLoading: false,

    // Summary
    summary:        null as AnalyticsSummary | null,
    summaryLoading: false,
    summaryError:   null as string | null,

    // Charts — keyed by cache key so switching orgs/range is instant on revisit
    mealsChart:        {} as Record<string, MealDataPoint[]>,
    mealsLoading:      false,
    mealsError:        null as string | null,

    attendanceChart:   {} as Record<string, AttendanceDataPoint[]>,
    attendanceLoading: false,
    attendanceError:   null as string | null,

    // Activity
    activities:        [] as ActivityItem[],
    activitiesLoading: false,
    activitiesError:   null as string | null,
  },
  reducers: {
    setSuperFilters(state, { payload }: { payload: Partial<SuperAnalyticsFilters> }) {
      state.filters = { ...state.filters, ...payload };
    },
    resetSuperFilters(state) {
      state.filters = { ...DEFAULT_SUPER_FILTERS };
    },
  },
  extraReducers: builder => {
    // Org options
    builder
      .addCase(fetchSuperOrgOptions.pending,   s => { s.orgOptionsLoading = true; })
      .addCase(fetchSuperOrgOptions.fulfilled, (s, { payload }) => { s.orgOptionsLoading = false; s.orgOptions = payload; })
      .addCase(fetchSuperOrgOptions.rejected,  s => { s.orgOptionsLoading = false; });

    // Vendor filter options
    builder
      .addCase(fetchSuperFilterOptions.pending,   s => { s.filterOptionsLoading = true; })
      .addCase(fetchSuperFilterOptions.fulfilled, (s, { payload }) => { s.filterOptionsLoading = false; s.vendorOptions = payload; })
      .addCase(fetchSuperFilterOptions.rejected,  s => { s.filterOptionsLoading = false; });

    // Summary
    builder
      .addCase(fetchSuperAnalyticsSummary.pending,   s => { s.summaryLoading = true;  s.summaryError = null; })
      .addCase(fetchSuperAnalyticsSummary.fulfilled, (s, { payload }) => { s.summaryLoading = false; s.summary = payload; })
      .addCase(fetchSuperAnalyticsSummary.rejected,  (s, { payload }) => { s.summaryLoading = false; s.summaryError = payload as string; });

    // Meals chart
    builder
      .addCase(fetchSuperMealsChart.pending,   s => { s.mealsLoading = true;  s.mealsError = null; })
      .addCase(fetchSuperMealsChart.fulfilled, (s, { payload }) => { s.mealsLoading = false; s.mealsChart[payload.key] = payload.data; })
      .addCase(fetchSuperMealsChart.rejected,  (s, { payload }) => { s.mealsLoading = false; s.mealsError = payload as string; });

    // Attendance chart
    builder
      .addCase(fetchSuperAttendanceChart.pending,   s => { s.attendanceLoading = true;  s.attendanceError = null; })
      .addCase(fetchSuperAttendanceChart.fulfilled, (s, { payload }) => { s.attendanceLoading = false; s.attendanceChart[payload.key] = payload.data; })
      .addCase(fetchSuperAttendanceChart.rejected,  (s, { payload }) => { s.attendanceLoading = false; s.attendanceError = payload as string; });

    // Activity
    builder
      .addCase(fetchSuperRecentActivity.pending,   s => { s.activitiesLoading = true;  s.activitiesError = null; })
      .addCase(fetchSuperRecentActivity.fulfilled, (s, { payload }) => { s.activitiesLoading = false; s.activities = payload; })
      .addCase(fetchSuperRecentActivity.rejected,  (s, { payload }) => { s.activitiesLoading = false; s.activitiesError = payload as string; });
  },
});

export const { setSuperFilters, resetSuperFilters } = superAnalyticsSlice.actions;
export default superAnalyticsSlice.reducer;