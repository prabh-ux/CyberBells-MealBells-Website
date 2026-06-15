// slices/superAdmin/superAdminVendorPerformanceSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types (identical shape to admin slice) ────────────────────────────────────

export interface DeliveryDay    { day: string; actual: number; target: number }
export interface RatingWeek     { week: string; v: number }
export interface FeedbackRow    {
  date:       string;
  dish:       string;
  image:      string;
  rating:     number;
  complaints: string;
  tags:       string[];
  onTime:     boolean;
}
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

// ── Thunks ────────────────────────────────────────────────────────────────────

/**
 * Fetches vendor list scoped to an org (or all orgs when orgId === "all").
 */
export const fetchSuperVendorList = createAsyncThunk(
  "superVendorPerformance/fetchList",
  async (orgId: string, { rejectWithValue }) => {
    try {
      const params = orgId !== "all" ? `?orgId=${orgId}` : "";
      const { data } = await axiosInstance.get(
        `/super-admin/vendor-performance/vendors${params}`
      );
      return data.vendors as VendorListItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendor list.");
    }
  }
);

/**
 * Fetches KPI data for a vendor (or all vendors) scoped to an org + period.
 * Cache key: `${orgId}__${vendorId}__${period}`
 */
export const fetchSuperVendorKpi = createAsyncThunk(
  "superVendorPerformance/fetchKpi",
  async (
    { orgId, vendorId, period }: { orgId: string; vendorId: string; period: string },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({ period });
      if (orgId !== "all") params.set("orgId", orgId);
      const { data } = await axiosInstance.get(
        `/super-admin/vendor-performance/${vendorId}?${params.toString()}`
      );
      return { orgId, vendorId, period, kpi: data.data as VendorKpi };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch KPI data.");
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

export const superVendorCacheKey = (orgId: string, vendorId: string, period: string) =>
  `${orgId}__${vendorId}__${period}`;

// ── Slice ─────────────────────────────────────────────────────────────────────

const superAdminVendorPerformanceSlice = createSlice({
  name: "superVendorPerformance",
  initialState: {
    vendors:     [] as VendorListItem[],
    listLoading: false,
    kpiCache:    {} as Record<string, VendorKpi>,
    kpiLoading:  false,
    error:       null as string | null,
  },
  reducers: {
    invalidateSuperVendorCache(state, action: { payload?: string }) {
      if (action.payload) {
        delete state.kpiCache[action.payload];
      } else {
        state.kpiCache = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperVendorList.pending,   (state) => { state.listLoading = true;  state.error = null; })
      .addCase(fetchSuperVendorList.fulfilled, (state, { payload }) => { state.listLoading = false; state.vendors = payload; })
      .addCase(fetchSuperVendorList.rejected,  (state, { payload }) => { state.listLoading = false; state.error = payload as string; });

    builder
      .addCase(fetchSuperVendorKpi.pending,   (state) => { state.kpiLoading = true;  state.error = null; })
      .addCase(fetchSuperVendorKpi.fulfilled, (state, { payload }) => {
        state.kpiLoading = false;
        const key = superVendorCacheKey(payload.orgId, payload.vendorId, payload.period);
        state.kpiCache[key] = payload.kpi;
      })
      .addCase(fetchSuperVendorKpi.rejected,  (state, { payload }) => { state.kpiLoading = false; state.error = payload as string; });
  },
});

export const { invalidateSuperVendorCache } = superAdminVendorPerformanceSlice.actions;
export default superAdminVendorPerformanceSlice.reducer;
