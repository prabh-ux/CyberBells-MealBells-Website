import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";
import type {
  WastageVendor, WastageSummary, WastageChartPoint,
  WastageTableRow, WastagePagination,
} from "../Foodwastageslice";

export type { WastageVendor, WastageSummary, WastageChartPoint, WastageTableRow, WastagePagination };

export interface SuperFoodWastageFilters {
  orgId:    string;
  vendor:   string;
  mealType: string;
  days:     7 | 14 | 30;
}

export const DEFAULT_SUPER_WASTAGE_FILTERS: SuperFoodWastageFilters = {
  orgId:    "all",
  vendor:   "all",
  mealType: "Both",
  days:     7,
};

const toQS = (f: SuperFoodWastageFilters, extra?: Record<string, string | number>) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.orgId    !== "all")  p.set("orgId",    f.orgId);
  if (f.vendor   !== "all")  p.set("vendor",   f.vendor);
  if (f.mealType !== "Both") p.set("mealType", f.mealType);
  if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, String(v)));
  return p.toString();
};

export const fetchSuperWastageVendors = createAsyncThunk(
  "superFoodWastage/fetchVendors",
  async (orgId: string = "all", { rejectWithValue }) => {
    try {
      const p = new URLSearchParams();
      if (orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/food-wastage/vendors?${p}`);
      return data.vendors as WastageVendor[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendors.");
    }
  }
);

export const fetchSuperWastageSummary = createAsyncThunk(
  "superFoodWastage/fetchSummary",
  async (filters: SuperFoodWastageFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/food-wastage/summary?${toQS(filters)}`);
      return data.summary as WastageSummary;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch summary.");
    }
  }
);

export const fetchSuperWastageChart = createAsyncThunk(
  "superFoodWastage/fetchChart",
  async (filters: SuperFoodWastageFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/food-wastage/chart?${toQS(filters)}`);
      return data.data as WastageChartPoint[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch chart.");
    }
  }
);

export const fetchSuperWastageTable = createAsyncThunk(
  "superFoodWastage/fetchTable",
  async (
    { filters, page = 1, limit = 5 }: { filters: SuperFoodWastageFilters; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get(
        `/super-admin/food-wastage/table?${toQS(filters, { page, limit })}`
      );
      return { rows: data.data as WastageTableRow[], pagination: data.pagination as WastagePagination };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch table.");
    }
  }
);

const superFoodWastageSlice = createSlice({
  name: "superFoodWastage",
  initialState: {
    filters:          DEFAULT_SUPER_WASTAGE_FILTERS as SuperFoodWastageFilters,
    filtersAppliedAt: 0 as number,

    vendors:        [] as WastageVendor[],
    vendorsLoading: false,

    summary:        null as WastageSummary | null,
    summaryLoading: false,

    chartData:    [] as WastageChartPoint[],
    chartLoading: false,

    tableRows:    [] as WastageTableRow[],
    pagination:   null as WastagePagination | null,
    tableLoading: false,

    currentPage: 1,
  },
  reducers: {
    setSuperWastageFilters(state, { payload }: { payload: Partial<SuperFoodWastageFilters> }) {
      state.filters          = { ...state.filters, ...payload };
      state.currentPage      = 1;
      state.filtersAppliedAt = Date.now();
    },
    resetSuperWastageFilters(state) {
      state.filters          = { ...DEFAULT_SUPER_WASTAGE_FILTERS };
      state.currentPage      = 1;
      state.filtersAppliedAt = Date.now();
    },
    setSuperWastagePage(state, { payload }: { payload: number }) {
      state.currentPage = payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSuperWastageVendors.pending,   s => { s.vendorsLoading = true; })
      .addCase(fetchSuperWastageVendors.fulfilled, (s, { payload }) => { s.vendorsLoading = false; s.vendors = payload; })
      .addCase(fetchSuperWastageVendors.rejected,  s => { s.vendorsLoading = false; });

    builder
      .addCase(fetchSuperWastageSummary.pending,   s => { s.summaryLoading = true; })
      .addCase(fetchSuperWastageSummary.fulfilled, (s, { payload }) => { s.summaryLoading = false; s.summary = payload; })
      .addCase(fetchSuperWastageSummary.rejected,  s => { s.summaryLoading = false; });

    builder
      .addCase(fetchSuperWastageChart.pending,   s => { s.chartLoading = true; })
      .addCase(fetchSuperWastageChart.fulfilled, (s, { payload }) => { s.chartLoading = false; s.chartData = payload; })
      .addCase(fetchSuperWastageChart.rejected,  s => { s.chartLoading = false; });

    builder
      .addCase(fetchSuperWastageTable.pending,   s => { s.tableLoading = true; })
      .addCase(fetchSuperWastageTable.fulfilled, (s, { payload }) => {
        s.tableLoading = false;
        s.tableRows    = payload.rows;
        s.pagination   = payload.pagination;
      })
      .addCase(fetchSuperWastageTable.rejected,  s => { s.tableLoading = false; });
  },
});

export const { setSuperWastageFilters, resetSuperWastageFilters, setSuperWastagePage } =
  superFoodWastageSlice.actions;
export default superFoodWastageSlice.reducer;