// store/ConsumptionSliceAdmin.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TopDish          { name: string; count: number; popularity: number; }
export interface MostActiveDept   { name: string; count: number; }
export interface LeastActiveDay   { name: string; dayOfWeek: number | null; count: number; }

export interface MealTypeBreakdown {
  vegCount:    number;
  nonVegCount: number;
  bothCount:   number;
  total:       number;
  veg:         number;
  nonVeg:      number;
  both:        number;
}

export interface HeatmapRow { dept: string; counts: number[]; }

export interface ConsumptionBreakdown {
  topDish:           TopDish;
  mostActiveDept:    MostActiveDept;
  leastActiveDay:    LeastActiveDay;
  mealTypeBreakdown: MealTypeBreakdown;
  heatmap:           HeatmapRow[];
}

export interface LiveFeedItem {
  time:       string;
  employee:   string;
  department: string;
  avatar:     string;
  item:       string;
  dishType:   string;
  status:     "SERVED" | "IN PREP";
}

// FIX: "This Week" = 7, "This Month" = 30, "Today" = 1
// Backend uses days param — pass 1 for today so only today's records are fetched
export interface ConsumptionFilters { days: 1 | 7 | 30; department: string; vendorId: string; }

const TIME_FRAME_TO_DAYS: Record<string, ConsumptionFilters["days"]> = {
  "Today":      1,   // FIX: was 7 — "Today" should only fetch 1 day
  "This Week":  7,
  "This Month": 30,
};

export const timeFrameToDays = (tf: string): ConsumptionFilters["days"] =>
  TIME_FRAME_TO_DAYS[tf] ?? 30;

// ── Thunks ────────────────────────────────────────────────────────────────────

const toQS = (f: ConsumptionFilters) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.department !== "all") p.set("department", f.department);
  if (f.vendorId   !== "all") p.set("vendorId",   f.vendorId);
  return p.toString();
};

export const fetchConsumptionBreakdown = createAsyncThunk(
  "consumption/fetchBreakdown",
  async (filters: ConsumptionFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/consumption-breakdown?${toQS(filters)}`);
      return data.data as ConsumptionBreakdown;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch consumption breakdown.");
    }
  }
);

export const fetchLiveFeed = createAsyncThunk(
  "consumption/fetchLiveFeed",
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/analytics/live-feed?limit=${limit}`);
      return data.data as LiveFeedItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch live feed.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const consumptionSlice = createSlice({
  name: "consumption",
  initialState: {
    filters: { days: 30 as const, department: "all", vendorId: "all" } as ConsumptionFilters,

    breakdown:        null as ConsumptionBreakdown | null,
    breakdownLoading: false,
    breakdownError:   null as string | null,

    liveFeed:        [] as LiveFeedItem[],
    liveFeedLoading: false,
    liveFeedError:   null as string | null,
  },
  reducers: {
    setConsumptionFilters(state, { payload }: { payload: Partial<ConsumptionFilters> }) {
      state.filters = { ...state.filters, ...payload };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchConsumptionBreakdown.pending,   s => { s.breakdownLoading = true;  s.breakdownError = null; })
      .addCase(fetchConsumptionBreakdown.fulfilled, (s, { payload }) => { s.breakdownLoading = false; s.breakdown = payload; })
      .addCase(fetchConsumptionBreakdown.rejected,  (s, { payload }) => { s.breakdownLoading = false; s.breakdownError = payload as string; });

    builder
      .addCase(fetchLiveFeed.pending,   s => { s.liveFeedLoading = true;  s.liveFeedError = null; })
      .addCase(fetchLiveFeed.fulfilled, (s, { payload }) => { s.liveFeedLoading = false; s.liveFeed = payload; })
      .addCase(fetchLiveFeed.rejected,  (s, { payload }) => { s.liveFeedLoading = false; s.liveFeedError = payload as string; });
  },
});

export const { setConsumptionFilters } = consumptionSlice.actions;
export default consumptionSlice.reducer;