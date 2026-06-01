import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Dish {
  _id:               string;
  name:              string;
  dishType:          "Veg" | "Non-Veg" | "Vegan" | string;
  description:       string;
  ingredients:       string;
  image:             string;
  estimatedCalories: string;
  tags:              string[];
}

export interface DashboardData {
  todayOrders:     number;
  pendingDelivery: number;
  reviewsToday:    { avg: number; count: number };
  mealsThisWeek:   number;
  attendance:      { present: number; absent: number };
  todayDish:       Dish | null;
}

export interface TodayMenuData {
  scheduleId:       string;
  scheduledDate:    string;
  expectedPortions: number;
  dish:             Dish;
}

export interface WeekDay {
  day:      string;
  date:     string;
  schedule: { scheduleId: string; dish: Dish } | null;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchVendorDashboard = createAsyncThunk(
  "vendors/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/dashboard");
      return data.data as DashboardData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load dashboard.");
    }
  }
);

export const fetchVendorTodayMenu = createAsyncThunk(
  "vendors/fetchTodayMenu",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/menu/today");
      return data.data as TodayMenuData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load today's menu.");
    }
  }
);

export const fetchVendorWeeklyMenu = createAsyncThunk(
  "vendors/fetchWeeklyMenu",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/menu/weekly");
      return data.data as WeekDay[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load weekly menu.");
    }
  }
);

export const updateTodayDish = createAsyncThunk(
  "vendors/updateTodayDish",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put("/vendor/menu/today", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as Dish;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update dish.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const vendorSlice = createSlice({
  name: "vendors",
  initialState: {
    dashboard:        null as DashboardData | null,
    todayMenu:        null as TodayMenuData | null,
    weeklyMenu:       [] as WeekDay[],
    dashboardLoading: false,
    menuLoading:      false,
    error:            null as string | null,
  },
  reducers: {
    clearVendorError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {

    // fetchVendorDashboard
    builder
      .addCase(fetchVendorDashboard.pending,   state => { state.dashboardLoading = true;  state.error = null; })
      .addCase(fetchVendorDashboard.fulfilled, (state, { payload }) => { state.dashboardLoading = false; state.dashboard = payload; })
      .addCase(fetchVendorDashboard.rejected,  (state, { payload }) => { state.dashboardLoading = false; state.error = payload as string; });

    // fetchVendorTodayMenu
    builder
      .addCase(fetchVendorTodayMenu.pending,   state => { state.menuLoading = true;  state.error = null; })
      .addCase(fetchVendorTodayMenu.fulfilled, (state, { payload }) => { state.menuLoading = false; state.todayMenu = payload; })
      .addCase(fetchVendorTodayMenu.rejected,  (state, { payload }) => { state.menuLoading = false; state.error = payload as string; });

    // fetchVendorWeeklyMenu
    builder
      .addCase(fetchVendorWeeklyMenu.pending,   state => { state.menuLoading = true;  state.error = null; })
      .addCase(fetchVendorWeeklyMenu.fulfilled, (state, { payload }) => { state.menuLoading = false; state.weeklyMenu = payload; })
      .addCase(fetchVendorWeeklyMenu.rejected,  (state, { payload }) => { state.menuLoading = false; state.error = payload as string; });

    // updateTodayDish
    builder
      .addCase(updateTodayDish.pending,   state => { state.menuLoading = true;  state.error = null; })
      .addCase(updateTodayDish.fulfilled, (state, { payload }) => {
        state.menuLoading = false;
        if (state.todayMenu) state.todayMenu.dish = payload;
      })
      .addCase(updateTodayDish.rejected,  (state, { payload }) => { state.menuLoading = false; state.error = payload as string; });
  },
});

export const { clearVendorError } = vendorSlice.actions;
export default vendorSlice.reducer;