// store/slices/foodWastageSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WastageVendor {
  _id:      string;
  name:     string;
  logo?:    string;
  foodType: string;
  status:   boolean;
}

export interface WastageSummary {
  totalExpected:     number;
  totalDelivered:    number;
  totalEaten:        number;
  totalWastage:      number;
  avgWastagePercent: number;
  efficiency:        number;
  wasteTrend:        number | null; // negative = improving, positive = worsening
}

export interface WastageChartPoint {
  day:       string;
  fullDate:  string;
  Expected:  number;
  Delivered: number;
  Eaten:     number;
  Wastage:   number;
}

export interface WastageTableRow {
  date:           string; // "Jun 08"
  fullDate:       string; // "2025-06-08"
  expected:       number;
  delivered:      number;
  eaten:          number;
  wastageCount:   number;
  wastagePercent: number;
}

export interface WastagePagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface FoodWastageFilters {
  vendor:   string; // "all" or vendor _id (ObjectId string)
  mealType: string; // "all" | "Veg" | "Non-Veg" | "Both"
  days:     7 | 14 | 30;
}

export const DEFAULT_WASTAGE_FILTERS: FoodWastageFilters = {
  vendor:   "all",
  mealType: "all",
  days:     7,
};

// ── Query-string builder ──────────────────────────────────────────────────────

const toQS = (
  f: FoodWastageFilters,
  extra?: Record<string, string | number>
) => {
  const p = new URLSearchParams({ days: String(f.days) });
  if (f.vendor   !== "all") p.set("vendor",   f.vendor);
  if (f.mealType !== "all") p.set("mealType", f.mealType);
  if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, String(v)));
  return p.toString();
};

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Fetch vendors from DB — replaces the old static VENDORS array */
export const fetchWastageVendors = createAsyncThunk(
  "foodWastage/fetchVendors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/food-wastage/vendors");
      return data.vendors as WastageVendor[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to fetch vendors."
      );
    }
  }
);

export const fetchWastageSummary = createAsyncThunk(
  "foodWastage/fetchSummary",
  async (filters: FoodWastageFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/admin/food-wastage/summary?${toQS(filters, { days: 30 })}`
      );
      return data.summary as WastageSummary;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to fetch wastage summary."
      );
    }
  }
);

export const fetchWastageChart = createAsyncThunk(
  "foodWastage/fetchChart",
  async (filters: FoodWastageFilters, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/admin/food-wastage/chart?${toQS(filters)}`
      );
      return data.data as WastageChartPoint[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to fetch wastage chart."
      );
    }
  }
);

export const fetchWastageTable = createAsyncThunk(
  "foodWastage/fetchTable",
  async (
    {
      filters,
      page  = 1,
      limit = 5,
    }: { filters: FoodWastageFilters; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get(
        `/admin/food-wastage/table?${toQS(filters, { page, limit })}`
      );
      return {
        rows:       data.data        as WastageTableRow[],
        pagination: data.pagination  as WastagePagination,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to fetch wastage table."
      );
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const foodWastageSlice = createSlice({
  name: "foodWastage",
  initialState: {
    filters: DEFAULT_WASTAGE_FILTERS as FoodWastageFilters,

    // Vendors (fetched from DB)
    vendors:        [] as WastageVendor[],
    vendorsLoading: false,
    vendorsError:   null as string | null,

    // Summary
    summary:        null as WastageSummary | null,
    summaryLoading: false,
    summaryError:   null as string | null,

    // Chart
    chartData:    [] as WastageChartPoint[],
    chartLoading: false,
    chartError:   null as string | null,

    // Table
    tableRows:    [] as WastageTableRow[],
    pagination:   null as WastagePagination | null,
    tableLoading: false,
    tableError:   null as string | null,

    currentPage: 1,
  },

  reducers: {
    setWastageFilters(
      state,
      { payload }: { payload: Partial<FoodWastageFilters> }
    ) {
      state.filters     = { ...state.filters, ...payload };
      state.currentPage = 1;
    },
    resetWastageFilters(state) {
      state.filters     = { ...DEFAULT_WASTAGE_FILTERS };
      state.currentPage = 1;
    },
    setWastagePage(state, { payload }: { payload: number }) {
      state.currentPage = payload;
    },
    clearWastageErrors(state) {
      state.summaryError = null;
      state.chartError   = null;
      state.tableError   = null;
      state.vendorsError = null;
    },
  },

  extraReducers: (builder) => {
    // Vendors
    builder
      .addCase(fetchWastageVendors.pending, (s) => {
        s.vendorsLoading = true;
        s.vendorsError   = null;
      })
      .addCase(fetchWastageVendors.fulfilled, (s, { payload }) => {
        s.vendorsLoading = false;
        s.vendors        = payload;
      })
      .addCase(fetchWastageVendors.rejected, (s, { payload }) => {
        s.vendorsLoading = false;
        s.vendorsError   = payload as string;
      });

    // Summary
    builder
      .addCase(fetchWastageSummary.pending,   (s) => { s.summaryLoading = true;  s.summaryError = null; })
      .addCase(fetchWastageSummary.fulfilled, (s, { payload }) => { s.summaryLoading = false; s.summary = payload; })
      .addCase(fetchWastageSummary.rejected,  (s, { payload }) => { s.summaryLoading = false; s.summaryError = payload as string; });

    // Chart
    builder
      .addCase(fetchWastageChart.pending,   (s) => { s.chartLoading = true;  s.chartError = null; })
      .addCase(fetchWastageChart.fulfilled, (s, { payload }) => { s.chartLoading = false; s.chartData = payload; })
      .addCase(fetchWastageChart.rejected,  (s, { payload }) => { s.chartLoading = false; s.chartError = payload as string; });

    // Table
    builder
      .addCase(fetchWastageTable.pending,   (s) => { s.tableLoading = true;  s.tableError = null; })
      .addCase(fetchWastageTable.fulfilled, (s, { payload }) => {
        s.tableLoading = false;
        s.tableRows    = payload.rows;
        s.pagination   = payload.pagination;
      })
      .addCase(fetchWastageTable.rejected,  (s, { payload }) => {
        s.tableLoading = false;
        s.tableError   = payload as string;
      });
  },
});

export const {
  setWastageFilters,
  resetWastageFilters,
  setWastagePage,
  clearWastageErrors,
} = foodWastageSlice.actions;

export default foodWastageSlice.reducer;