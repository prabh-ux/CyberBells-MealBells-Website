import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

export interface TopDish        { name: string; count: number; popularity: number; }
export interface MostActiveDept { name: string; count: number; }
export interface LeastActiveDay { name: string; dayOfWeek: number | null; count: number; }

export interface MealTypeBreakdown {
  vegCount: number; nonVegCount: number; bothCount: number;
  total: number; veg: number; nonVeg: number; both: number;
}

export interface HeatmapRow { dept: string; counts: number[]; }

export interface SuperConsumptionBreakdown {
  topDish:           TopDish;
  mostActiveDept:    MostActiveDept;
  leastActiveDay:    LeastActiveDay;
  mealTypeBreakdown: MealTypeBreakdown;
  heatmap:           HeatmapRow[];
}

export interface SuperLiveFeedItem {
  time: string; employee: string; department: string;
  avatar: string; item: string; dishType: string;
  status: "SERVED" | "IN PREP";
}

export interface SuperConsumptionFilters {
  days:       1 | 7 | 30;
  orgId:      string;
  department: string;
  vendorId:   string;
  mealType:   string;
}

export const DEFAULT_SUPER_CONSUMPTION_FILTERS: SuperConsumptionFilters = {
  days: 30, orgId: "all", department: "all", vendorId: "all", mealType: "all",
};

export const TIME_FRAME_TO_DAYS: Record<string, SuperConsumptionFilters["days"]> = {
  "Today":      1,
  "This Week":  7,
  "This Month": 30,
};

export const superTimeFrameToDays = (tf: string): SuperConsumptionFilters["days"] =>
  TIME_FRAME_TO_DAYS[tf] ?? 30;

const toQS = (f: SuperConsumptionFilters) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.orgId      !== "all") p.set("orgId",      f.orgId);
  if (f.department !== "all") p.set("department", f.department);
  if (f.vendorId   !== "all") p.set("vendorId",   f.vendorId);
  if (f.mealType   !== "all") p.set("mealType",   f.mealType);
  return p.toString();
};

export const fetchSuperConsumptionBreakdown = createAsyncThunk(
  "superConsumption/fetchBreakdown",
  async (filters: SuperConsumptionFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/super-admin/analytics/consumption-breakdown?${toQS(filters)}`
      );
      return data.data as SuperConsumptionBreakdown;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch breakdown.");
    }
  }
);

export const fetchSuperLiveFeed = createAsyncThunk(
  "superConsumption/fetchLiveFeed",
  async (filters: { limit?: number } & Partial<SuperConsumptionFilters>, { rejectWithValue }) => {
    try {
      const p = new URLSearchParams({ limit: String(filters.limit ?? 20) });
      if (filters.orgId      && filters.orgId      !== "all") p.set("orgId",      filters.orgId);
      if (filters.department && filters.department !== "all") p.set("department", filters.department);
      if (filters.vendorId   && filters.vendorId   !== "all") p.set("vendorId",   filters.vendorId);
      if (filters.mealType   && filters.mealType   !== "all") p.set("mealType",   filters.mealType);
      const { data } = await axiosInstance.get(`/super-admin/analytics/live-feed?${p}`);
      return data.data as SuperLiveFeedItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch live feed.");
    }
  }
);

const superConsumptionSlice = createSlice({
  name: "superConsumption",
  initialState: {
    filters: DEFAULT_SUPER_CONSUMPTION_FILTERS as SuperConsumptionFilters,

    breakdown:        null as SuperConsumptionBreakdown | null,
    breakdownLoading: false,
    breakdownError:   null as string | null,

    liveFeed:        [] as SuperLiveFeedItem[],
    liveFeedLoading: false,
    liveFeedError:   null as string | null,
  },
  reducers: {
    setSuperConsumptionFilters(state, { payload }: { payload: Partial<SuperConsumptionFilters> }) {
      state.filters = { ...state.filters, ...payload };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSuperConsumptionBreakdown.pending,   s => { s.breakdownLoading = true;  s.breakdownError = null; })
      .addCase(fetchSuperConsumptionBreakdown.fulfilled, (s, { payload }) => { s.breakdownLoading = false; s.breakdown = payload; })
      .addCase(fetchSuperConsumptionBreakdown.rejected,  (s, { payload }) => { s.breakdownLoading = false; s.breakdownError = payload as string; });

    builder
      .addCase(fetchSuperLiveFeed.pending,   s => { s.liveFeedLoading = true;  s.liveFeedError = null; })
      .addCase(fetchSuperLiveFeed.fulfilled, (s, { payload }) => { s.liveFeedLoading = false; s.liveFeed = payload; })
      .addCase(fetchSuperLiveFeed.rejected,  (s, { payload }) => { s.liveFeedLoading = false; s.liveFeedError = payload as string; });
  },
});

export const { setSuperConsumptionFilters } = superConsumptionSlice.actions;
export default superConsumptionSlice.reducer;