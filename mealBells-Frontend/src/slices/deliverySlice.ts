import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Vendor types ──────────────────────────────────────────────────────────────

export interface DeliveryStep {
  key:      string;
  label:    string;
  status:   "completed" | "current" | "pending";
  subtitle: string;
}

export interface DeliveryData {
  _id:         string;
  status:      string;
  isCompleted: boolean;
  canAdvance:  boolean;
  steps:       DeliveryStep[];
}

// ── User types ────────────────────────────────────────────────────────────────

export interface UserDeliveryStep {
  id:     string;
  label:  string;
  icon:   string;
  status: "done" | "active" | "pending";
  time:   string | null;
}

export interface UserDeliveryData {
  deliveryId:       string;
  status:           string;
  isCompleted:      boolean;
  canAdvance:       boolean;
  estimatedArrival: string | null;
  steps:            UserDeliveryStep[];
  dish: {
    name:  string;
    image: string;
  };
}

// ── State ─────────────────────────────────────────────────────────────────────

interface DeliveryState {
  // vendor
  delivery: DeliveryData | null;
  loading:  boolean;
  saving:   boolean;
  error:    string | null;

  // user
  userDelivery:        UserDeliveryData | null;
  loadingUserDelivery: boolean;
  userDeliveryError:   string | null;
}

const initialState: DeliveryState = {
  delivery: null,
  loading:  false,
  saving:   false,
  error:    null,

  userDelivery:        null,
  loadingUserDelivery: false,
  userDeliveryError:   null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

// ✅ FIX: accept orgId so the request is scoped to the vendor's active org
export const fetchTodayDelivery = createAsyncThunk<DeliveryData, string | undefined, { rejectValue: string }>(
  "delivery/fetchToday",
  async (orgId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/delivery/today", {
        params: orgId ? { orgId } : {},
      });
      return data.data as DeliveryData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load delivery.");
    }
  }
);

// ✅ FIX: accept orgId so advance is scoped to the same org as the displayed delivery
export const advanceDelivery = createAsyncThunk<
  DeliveryData,
  { deliveryId: string; orgId?: string },
  { rejectValue: string }
>(
  "delivery/advance",
  async ({ deliveryId, orgId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/vendor/delivery/${deliveryId}/advance`,
        {},
        { params: orgId ? { orgId } : {} }
      );

      return data.data as DeliveryData;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to update status."
      );
    }
  }
);
export const fetchUserDelivery = createAsyncThunk<UserDeliveryData, void, { rejectValue: string }>(
  "delivery/fetchUserToday",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/user/delivery/today");
      return data.data as UserDeliveryData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to load delivery.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // vendor: fetch
    builder
      .addCase(fetchTodayDelivery.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchTodayDelivery.fulfilled, (state, action) => { state.loading = false; state.delivery = action.payload; })
      .addCase(fetchTodayDelivery.rejected,  (state, action) => { state.loading = false; state.error = action.payload ?? "Unknown error"; });

    // vendor: advance
    builder
      .addCase(advanceDelivery.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(advanceDelivery.fulfilled, (state, action) => { state.saving = false; state.delivery = action.payload; })
      .addCase(advanceDelivery.rejected,  (state, action) => { state.saving = false; state.error = action.payload ?? "Unknown error"; });

    // user: fetch
    builder
      .addCase(fetchUserDelivery.pending,   (state) => { state.loadingUserDelivery = true;  state.userDeliveryError = null; })
      .addCase(fetchUserDelivery.fulfilled, (state, action) => { state.loadingUserDelivery = false; state.userDelivery = action.payload; })
      .addCase(fetchUserDelivery.rejected,  (state, action) => { state.loadingUserDelivery = false; state.userDeliveryError = action.payload ?? "Unknown error"; });
  },
});

export default deliverySlice.reducer;