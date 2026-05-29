import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Dish {
  _id?:               string;
  name:               string;
  description:        string;
  dishType:           "Veg" | "Non-Veg" | "Vegan" | string;
  image:              string;
  estimatedCalories:  string | number;
  protein?:           string;
  carbs?:             string;
  tags:               string[];
  ingredientsList?:   string[];
  vendor?:            { name: string; logo?: string; rating: number; foodType?: string };
}

export interface MenuData {
  scheduleId:       string;
  scheduledDate:    string;
  dish:             Dish;
  colleaguesEating: number;
  colleagueAvatars: string[];
  myResponse:       "yes" | "no" | null;
}

export interface WeeklyMenuItem {
  scheduleId:    string;
  scheduledDate: string;
  dish:          Dish;
  myResponse:    "yes" | "no" | null;
}

export interface DishDetailsData {
  scheduleId:    string;
  scheduledDate: string;
  dish:          Dish;
  myAttendance:  "yes" | "no" | null;
  hasReviewed:   boolean;
  myReview:      null;
}

export interface Review {
  _id:           string;
  scheduleId:    string;
  createdAt:     string;
  overallRating: number;
  taste:         number;
  quantity:      number;
  quality:       number;
  freshness:     number;
  comment?:      string;
  tags?:         string[];
  dishId?: {
    name: string; image?: string;
    dishType: "Veg" | "Non-Veg";
    vendor?: { name: string; logo?: string };
    tags?: string[];
  };
}

export interface ReviewsData {
  reviews:      Review[];
  totalReviews: number;
  avgRating:    number;
  page:         number;
  totalPages:   number;
}

export type ConsumptionPeriod = "week" | "month" | "year";

export interface ChartBar {
  day:   string;
  meals: number;
}

export interface ConsumptionStatsData {
  period:       string;
  daysAttended: number;
  daysSkipped:  number;
  totalMeals:   number;
  mostEaten:    string;
  currentStreak: number;
  chartData:    ChartBar[];
}

export interface ReviewSummary {
  totalReviews: number;
  avgRating:    number;
}

export type DietOption  = "Veg" | "Non-Veg" | "Both";
export type SpiceLevel  = "Mild" | "Normal" | "Spicy";

export interface DishRequestPayload {
  requestedDate:     string;
  dishSuggestion:    string;
  dietaryPreference: DietOption;
  spiceLevel:        SpiceLevel;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Fetch today's menu */
export const fetchTodayMenu = createAsyncThunk(
  "user/fetchTodayMenu",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/user/menu-today");
      return data.data as MenuData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch today's menu.");
    }
  }
);

/** Mark attendance (today panel — POST) */
export const markAttendance = createAsyncThunk(
  "user/markAttendance",
  async (
    { response, scheduleId }: { response: "yes" | "no"; scheduleId: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post("/user/attendance", { response, scheduleId });
      return data.data as Partial<MenuData>;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to mark attendance.");
    }
  }
);

/** Fetch weekly menu (with optional offset) */
export const fetchWeeklyMenu = createAsyncThunk(
  "user/fetchWeeklyMenu",
  async (offset: number = 0, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/user/menu-weekly?offset=${offset}`);
      return data.data.schedules as WeeklyMenuItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch weekly menu.");
    }
  }
);

/** Fetch a single dish's details by scheduleId */
export const fetchDishDetails = createAsyncThunk(
  "user/fetchDishDetails",
  async (scheduleId: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/user/dish/${scheduleId}`);
      return data.data as DishDetailsData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load dish details.");
    }
  }
);

/** Mark / update attendance from the dish details panel (PATCH) */
export const patchDishAttendance = createAsyncThunk(
  "user/patchDishAttendance",
  async (
    { scheduleId, response }: { scheduleId: string; response: "yes" | "no" },
    { rejectWithValue }
  ) => {
    try {
      await axiosInstance.patch(`/user/attendance/${scheduleId}`, { response });
      return { scheduleId, response };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update attendance.");
    }
  }
);

/** Fetch the current user's reviews (paginated) */
export const fetchMyReviews = createAsyncThunk(
  "user/fetchMyReviews",
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/user/reviews?page=${page}&limit=${limit}`);
      return data.data as ReviewsData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch reviews.");
    }
  }
);

/** Submit or update a meal review */
export const submitReview = createAsyncThunk(
  "user/submitReview",
  async (
    payload: {
      scheduleId: string;
      overallRating: number;
      taste: number;
      quantity: number;
      quality: number;
      freshness: number;
      comment: string;
      tags: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post("/user/review", payload);
      return data as { success: boolean };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Submission failed.");
    }
  }
);

/** Fetch consumption stats for a given period */
export const fetchConsumptionStats = createAsyncThunk(
  "user/fetchConsumptionStats",
  async (period: ConsumptionPeriod, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/user/consumption-stats", {
        params: { period },
      });
      if (data.success) return data.data as ConsumptionStatsData;
      return rejectWithValue(data.msg ?? "Failed to load stats.");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load stats.");
    }
  }
);

/** Fetch review summary (total + avg rating) */
export const fetchReviewSummary = createAsyncThunk(
  "user/fetchReviewSummary",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/user/reviews", {
        params: { page: 1, limit: 1 },
      });
      if (data.success) {
        return {
          totalReviews: data.data.totalReviews,
          avgRating:    data.data.avgRating,
        } as ReviewSummary;
      }
      return rejectWithValue("Failed to load review summary.");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load review summary.");
    }
  }
);

/** Submit a dish request */
export const submitDishRequest = createAsyncThunk(
  "user/submitDishRequest",
  async (payload: DishRequestPayload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/user/dish-request", payload);
      if (data.success) return true;
      return rejectWithValue(data.msg ?? "Something went wrong.");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to submit request.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: "user",
  initialState: {
    // today
    todayMenu:    null as MenuData | null,
    loadingToday: false,

    // weekly
    weeklyMenu:    [] as WeeklyMenuItem[],
    loadingWeekly: false,

    // dish details
    dishDetails:    null as DishDetailsData | null,
    loadingDish:    false,
    dishError:      null as string | null,

    // reviews
    reviewsData:    null as ReviewsData | null,
    loadingReviews: false,
    reviewsError:   null as string | null,

    // consumption report
    consumptionStats:        null as ConsumptionStatsData | null,
    loadingConsumptionStats: false,
    consumptionStatsError:   null as string | null,

    // review summary (used in consumption report)
    reviewSummary:        null as ReviewSummary | null,
    loadingReviewSummary: false,

    // dish request
    dishRequestSuccess:   false,
    submittingDishRequest: false,
    dishRequestError:     null as string | null,

    // shared loading flags
    voting:      false,   // attendance in today panel
    dishVoting:  false,   // attendance in dish-details panel
    submitting:  false,   // review submission

    error: null as string | null,
  },
  reducers: {
    resetUserError(state)       { state.error = null; },
    resetDishDetails(state)     { state.dishDetails = null; state.dishError = null; },
    resetReviewsError(state)    { state.reviewsError = null; },
    resetDishRequest(state)     {
      state.dishRequestSuccess  = false;
      state.dishRequestError    = null;
    },
    resetConsumptionError(state) { state.consumptionStatsError = null; },
  },
  extraReducers: (builder) => {

    // ── fetchTodayMenu ──────────────────────────────────────────────────────
    builder.addCase(fetchTodayMenu.pending,   (state) => { state.loadingToday = true;  state.error = null; });
    builder.addCase(fetchTodayMenu.fulfilled, (state, { payload }) => { state.loadingToday = false; state.todayMenu = payload; });
    builder.addCase(fetchTodayMenu.rejected,  (state, { payload }) => { state.loadingToday = false; state.error = payload as string; });

    // ── markAttendance (POST — today panel) ─────────────────────────────────
    builder.addCase(markAttendance.pending,   (state) => { state.voting = true;  state.error = null; });
    builder.addCase(markAttendance.fulfilled, (state, { payload }) => {
      state.voting = false;
      if (state.todayMenu) state.todayMenu = { ...state.todayMenu, ...payload };
    });
    builder.addCase(markAttendance.rejected,  (state, { payload }) => { state.voting = false; state.error = payload as string; });

    // ── fetchWeeklyMenu ─────────────────────────────────────────────────────
    builder.addCase(fetchWeeklyMenu.pending,   (state) => { state.loadingWeekly = true;  state.error = null; });
    builder.addCase(fetchWeeklyMenu.fulfilled, (state, { payload }) => { state.loadingWeekly = false; state.weeklyMenu = payload; });
    builder.addCase(fetchWeeklyMenu.rejected,  (state, { payload }) => { state.loadingWeekly = false; state.error = payload as string; });

    // ── fetchDishDetails ────────────────────────────────────────────────────
    builder.addCase(fetchDishDetails.pending,   (state) => { state.loadingDish = true;  state.dishError = null; });
    builder.addCase(fetchDishDetails.fulfilled, (state, { payload }) => { state.loadingDish = false; state.dishDetails = payload; });
    builder.addCase(fetchDishDetails.rejected,  (state, { payload }) => { state.loadingDish = false; state.dishError = payload as string; });

    // ── patchDishAttendance (PATCH — dish-details panel) ────────────────────
    builder.addCase(patchDishAttendance.pending,   (state) => { state.dishVoting = true; });
    builder.addCase(patchDishAttendance.fulfilled, (state, { payload }) => {
      state.dishVoting = false;
      if (state.dishDetails) state.dishDetails.myAttendance = payload.response;
    });
    builder.addCase(patchDishAttendance.rejected,  (state) => { state.dishVoting = false; });

    // ── fetchMyReviews ──────────────────────────────────────────────────────
    builder.addCase(fetchMyReviews.pending,   (state) => { state.loadingReviews = true;  state.reviewsError = null; });
    builder.addCase(fetchMyReviews.fulfilled, (state, { payload }) => { state.loadingReviews = false; state.reviewsData = payload; });
    builder.addCase(fetchMyReviews.rejected,  (state, { payload }) => { state.loadingReviews = false; state.reviewsError = payload as string; });

    // ── submitReview ────────────────────────────────────────────────────────
    builder.addCase(submitReview.pending,   (state) => { state.submitting = true;  state.error = null; });
    builder.addCase(submitReview.fulfilled, (state) => { state.submitting = false; });
    builder.addCase(submitReview.rejected,  (state, { payload }) => { state.submitting = false; state.error = payload as string; });

    // ── fetchConsumptionStats ───────────────────────────────────────────────
    builder.addCase(fetchConsumptionStats.pending, (state) => {
      state.loadingConsumptionStats  = true;
      state.consumptionStatsError    = null;
    });
    builder.addCase(fetchConsumptionStats.fulfilled, (state, { payload }) => {
      state.loadingConsumptionStats = false;
      state.consumptionStats        = payload;
    });
    builder.addCase(fetchConsumptionStats.rejected, (state, { payload }) => {
      state.loadingConsumptionStats = false;
      state.consumptionStatsError   = payload as string;
    });

    // ── fetchReviewSummary ──────────────────────────────────────────────────
    builder.addCase(fetchReviewSummary.pending,   (state) => { state.loadingReviewSummary = true; });
    builder.addCase(fetchReviewSummary.fulfilled, (state, { payload }) => {
      state.loadingReviewSummary = false;
      state.reviewSummary        = payload;
    });
    builder.addCase(fetchReviewSummary.rejected,  (state) => { state.loadingReviewSummary = false; });

    // ── submitDishRequest ───────────────────────────────────────────────────
    builder.addCase(submitDishRequest.pending, (state) => {
      state.submittingDishRequest = true;
      state.dishRequestError      = null;
    });
    builder.addCase(submitDishRequest.fulfilled, (state) => {
      state.submittingDishRequest = false;
      state.dishRequestSuccess    = true;
    });
    builder.addCase(submitDishRequest.rejected, (state, { payload }) => {
      state.submittingDishRequest = false;
      state.dishRequestError      = payload as string;
    });
  },
});

export const {
  resetUserError,
  resetDishDetails,
  resetReviewsError,
  resetDishRequest,
  resetConsumptionError,
} = userSlice.actions;

export default userSlice.reducer;