import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Dish {
  _id:               string;
  name:              string;
  dishType:          "Veg" | "Non-Veg" | string;
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

export interface ScheduleData {
  _id:           string;
  scheduledDate: string;
  dish:          Dish;
}

// ── Review types ──────────────────────────────────────────────────────────────

export interface VendorReview {
  _id:           string;
  overallRating: number;
  taste:         number;
  quantity:      number;
  quality:       number;
  freshness:     number;
  comment:       string;
  tags:          string[];
  createdAt:     string;
  userId?: {
    _id:    string;
    name:   string;
    avatar: string;
  };
  dishId?: {
    _id:      string;
    name:     string;
    image:    string;
    dishType: string;
  };
}

export interface VendorReviewSummary {
  avgRating:    number;
  totalReviews: number;
  avgTaste:     number;
  avgQuantity:  number;
  avgQuality:   number;
  avgFreshness: number;
}

export interface VendorReviewsData {
  reviews:    VendorReview[];
  total:      number;
  page:       number;
  totalPages: number;
  summary:    VendorReviewSummary;
}

// ── Analytics types ───────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'week' | 'month' | 'year';

export interface AnalyticsDishEntry {
  dishId:  string;
  name:    string;
  image:   string;
  orders:  number;
  percent: number;
}

export interface AnalyticsData {
  period:         AnalyticsPeriod;
  totalBoxes:     number;
  avgDailyMeals:  number;
  peakDay:        { label: string; orders: number };
  avgRating:      number;
  totalReviews:   number;
  vegCount:       number;
  nonVegCount:    number;
  vegPct:         number;
  nonVegPct:      number;
  boxesDelivered: { day: string; boxes: number }[];
  mostPopular:    AnalyticsDishEntry | null;
  leastPopular:   AnalyticsDishEntry | null;
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

export const fetchVendorDishes = createAsyncThunk(
  "vendors/fetchDishes",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/dishes");
      return data.dishes as Dish[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load dishes.");
    }
  }
);

export const fetchVendorScheduleById = createAsyncThunk(
  "vendors/fetchScheduleById",
  async (scheduleId: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/vendor/menu/schedule/${scheduleId}`);
      return data.data as ScheduleData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load schedule.");
    }
  }
);

export const updateVendorScheduleDish = createAsyncThunk(
  "vendors/updateScheduleDish",
  async (
    { scheduleId, dishId }: { scheduleId: string; dishId: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.put(
        `/vendor/menu/schedule/${scheduleId}`,
        { dishId }
      );
      return data.data as ScheduleData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update schedule.");
    }
  }
);

export const createVendorSchedule = createAsyncThunk(
  "vendors/createSchedule",
  async (
    { dishId, date }: { dishId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post("/vendor/menu/schedule", { dishId, date });
      return data.data as ScheduleData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to create schedule.");
    }
  }
);

export const updateVendorDish = createAsyncThunk(
  "vendors/updateDish",
  async ({ dishId, formData }: { dishId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/vendor/dish/${dishId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as Dish;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update dish.");
    }
  }
);

export const createVendorDish = createAsyncThunk(
  "vendors/createDish",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/vendor/dishes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as { dish: Dish; schedule: ScheduleData | null };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to create dish.");
    }
  }
);

export const fetchVendorReviews = createAsyncThunk(
  "vendors/fetchReviews",
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/reviews", { params: { page, limit } });
      return data.data as VendorReviewsData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load reviews.");
    }
  }
);

export const fetchVendorAnalytics = createAsyncThunk(
  "vendors/fetchAnalytics",
  async (period: AnalyticsPeriod, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/analytics", { params: { period } });
      return data.data as AnalyticsData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load analytics.");
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
    dishes:           [] as Dish[],
    currentSchedule:  null as ScheduleData | null,

    // reviews
    reviewsData:    null as VendorReviewsData | null,
    reviewsLoading: false,
    reviewsError:   null as string | null,

    // analytics
    analyticsData:    null as AnalyticsData | null,
    analyticsLoading: false,
    analyticsError:   null as string | null,

    dashboardLoading: false,
    menuLoading:      false,
    dishesLoading:    false,
    scheduleLoading:  false,
    scheduleSaving:   false,
    error:            null as string | null,
  },
  reducers: {
    clearVendorError(state) {
      state.error = null;
    },
    clearCurrentSchedule(state) {
      state.currentSchedule = null;
    },
    clearReviewsError(state) {
      state.reviewsError = null;
    },
    clearAnalyticsError(state) {
      state.analyticsError = null;
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

    // fetchVendorDishes
    builder
      .addCase(fetchVendorDishes.pending,   state => { state.dishesLoading = true;  state.error = null; })
      .addCase(fetchVendorDishes.fulfilled, (state, { payload }) => { state.dishesLoading = false; state.dishes = payload; })
      .addCase(fetchVendorDishes.rejected,  (state, { payload }) => { state.dishesLoading = false; state.error = payload as string; });

    // fetchVendorScheduleById
    builder
      .addCase(fetchVendorScheduleById.pending,   state => { state.scheduleLoading = true;  state.error = null; })
      .addCase(fetchVendorScheduleById.fulfilled, (state, { payload }) => { state.scheduleLoading = false; state.currentSchedule = payload; })
      .addCase(fetchVendorScheduleById.rejected,  (state, { payload }) => { state.scheduleLoading = false; state.error = payload as string; });

    // updateVendorScheduleDish
    builder
      .addCase(updateVendorScheduleDish.pending,   state => { state.scheduleSaving = true;  state.error = null; })
      .addCase(updateVendorScheduleDish.fulfilled, (state, { payload }) => {
        state.scheduleSaving = false;
        state.currentSchedule = payload;
        const entry = state.weeklyMenu.find(w => w.schedule?.scheduleId === payload._id);
        if (entry && entry.schedule) entry.schedule.dish = payload.dish;
      })
      .addCase(updateVendorScheduleDish.rejected,  (state, { payload }) => { state.scheduleSaving = false; state.error = payload as string; });

    // createVendorSchedule
    builder
      .addCase(createVendorSchedule.pending,   state => { state.scheduleSaving = true;  state.error = null; })
      .addCase(createVendorSchedule.fulfilled, (state, { payload }) => {
        state.scheduleSaving = false;
        const entry = state.weeklyMenu.find(w => {
          const d1 = new Date(w.date).toDateString();
          const d2 = new Date(payload.scheduledDate).toDateString();
          return d1 === d2;
        });
        if (entry) entry.schedule = { scheduleId: payload._id, dish: payload.dish };
      })
      .addCase(createVendorSchedule.rejected,  (state, { payload }) => { state.scheduleSaving = false; state.error = payload as string; });

    // updateVendorDish
    builder
      .addCase(updateVendorDish.pending,   state => { state.scheduleSaving = true;  state.error = null; })
      .addCase(updateVendorDish.fulfilled, (state, { payload }) => {
        state.scheduleSaving = false;
        state.weeklyMenu.forEach(w => {
          if (w.schedule?.dish._id === payload._id) w.schedule.dish = payload;
        });
        if (state.currentSchedule?.dish._id === payload._id) {
          state.currentSchedule.dish = payload;
        }
      })
      .addCase(updateVendorDish.rejected,  (state, { payload }) => { state.scheduleSaving = false; state.error = payload as string; });

    // createVendorDish
    builder
      .addCase(createVendorDish.pending,   state => { state.scheduleSaving = true;  state.error = null; })
      .addCase(createVendorDish.fulfilled, (state, { payload }) => {
        state.scheduleSaving = false;
        state.dishes.unshift(payload.dish);
        if (payload.schedule) {
          const entry = state.weeklyMenu.find(w => {
            const d1 = new Date(w.date).toDateString();
            const d2 = new Date(payload.schedule!.scheduledDate).toDateString();
            return d1 === d2;
          });
          if (entry) entry.schedule = { scheduleId: payload.schedule._id, dish: payload.dish };
        }
      })
      .addCase(createVendorDish.rejected,  (state, { payload }) => { state.scheduleSaving = false; state.error = payload as string; });

    // fetchVendorReviews
    builder
      .addCase(fetchVendorReviews.pending,   state => { state.reviewsLoading = true;  state.reviewsError = null; })
      .addCase(fetchVendorReviews.fulfilled, (state, { payload }) => { state.reviewsLoading = false; state.reviewsData = payload; })
      .addCase(fetchVendorReviews.rejected,  (state, { payload }) => { state.reviewsLoading = false; state.reviewsError = payload as string; });

    // fetchVendorAnalytics
    builder
      .addCase(fetchVendorAnalytics.pending,   state => { state.analyticsLoading = true;  state.analyticsError = null; })
      .addCase(fetchVendorAnalytics.fulfilled, (state, { payload }) => { state.analyticsLoading = false; state.analyticsData = payload; })
      .addCase(fetchVendorAnalytics.rejected,  (state, { payload }) => { state.analyticsLoading = false; state.analyticsError = payload as string; });
  },
});

export const {
  clearVendorError,
  clearCurrentSchedule,
  clearReviewsError,
  clearAnalyticsError,
} = vendorSlice.actions;

export default vendorSlice.reducer;