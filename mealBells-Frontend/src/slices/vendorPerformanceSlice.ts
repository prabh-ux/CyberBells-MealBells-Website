import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

export interface DeliveryDay    { day: string; actual: number; target: number }
export interface RatingWeek     { week: string; v: number }
export interface FeedbackRow    { date: string; dish: string; image: string; rating: number; complaints: string; tags: string[]; onTime: boolean }
export interface VendorListItem { _id: string; name: string; logo: string }

export interface VendorKpi {
  timeliness:       number;
  timelinessChange: number | null;
  rating:           number;
  ratingChange:     number | null;
  ratingReviews:    number;
  accuracy:         number;
  accuracyChange:   number | null;
  quality:          number;
  positives:        number;
  deliveryData:     DeliveryDay[];
  ratingTrend:      RatingWeek[];
  recentFeedback:   FeedbackRow[];
}

export const fetchVendorList = createAsyncThunk(
  "vendorPerformance/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/vendor-performance/vendors");
      return data.vendors as VendorListItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendor list.");
    }
  }
);

export const fetchVendorKpi = createAsyncThunk(
  "vendorPerformance/fetchKpi",
  async ({ vendorId, period }: { vendorId: string; period: string }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/admin/vendor-performance/${vendorId}?period=${encodeURIComponent(period)}`
      );
      return { vendorId, period, kpi: data.data as VendorKpi };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch KPI data.");
    }
  }
);

const vendorPerformanceSlice = createSlice({
  name: "vendorPerformance",
  initialState: {
    vendors:     [] as VendorListItem[],
    listLoading: false,
    kpiCache:    {} as Record<string, VendorKpi>,
    kpiLoading:  false,
    error:       null as string | null,
  },
  reducers: {
    // Call this to bust the cache for a specific key (or all keys)
    // so the next fetchVendorKpi always hits the network.
    invalidateCache(state, action: { payload?: string }) {
      if (action.payload) {
        delete state.kpiCache[action.payload];
      } else {
        state.kpiCache = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorList.pending,   (state) => { state.listLoading = true;  state.error = null; })
      .addCase(fetchVendorList.fulfilled, (state, { payload }) => { state.listLoading = false; state.vendors = payload; })
      .addCase(fetchVendorList.rejected,  (state, { payload }) => { state.listLoading = false; state.error = payload as string; });

    builder
      .addCase(fetchVendorKpi.pending,   (state) => { state.kpiLoading = true;  state.error = null; })
      .addCase(fetchVendorKpi.fulfilled, (state, { payload }) => {
        state.kpiLoading = false;
        state.kpiCache[`${payload.vendorId}__${payload.period}`] = payload.kpi;
      })
      .addCase(fetchVendorKpi.rejected,  (state, { payload }) => { state.kpiLoading = false; state.error = payload as string; });
  },
});

export const { invalidateCache } = vendorPerformanceSlice.actions;
export default vendorPerformanceSlice.reducer;