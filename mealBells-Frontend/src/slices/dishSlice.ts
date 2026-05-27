import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";
import type { MenuItem } from "../types/admin";

const normaliseDish = (d: any): MenuItem => ({
  ...d,
  id:                d._id,
  vendor:            d.vendor?.name      ?? "",
  vendorId:          d.vendor?._id       ?? "",
  availability:      d.availability      ?? "",
  createdAt:         d.createdAt         ?? "",
  qualityScore:      d.qualityScore      ?? "High",
  estimatedCalories: d.estimatedCalories ?? "450 kcal",
  prepTime:          d.prepTime          ?? "20 mins",
});

const normaliseSchedule = (s: any): MenuItem | null => {
  if (!s || !s.dish) return null;   // guard against broken dish refs
  return {
    ...normaliseDish(s.dish),
    scheduleId:    s._id,
    scheduledDate: s.scheduledDate,
  };
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchDishes = createAsyncThunk(
  "dishes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/dishes");
      return data.dishes.map(normaliseDish);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch dishes.");
    }
  }
);

export const fetchDishById = createAsyncThunk(
  "dishes/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/dishes/${id}`);
      const dish = normaliseDish(data.dish);
      if (data.schedule) {
        dish.scheduleId    = data.schedule._id;
        dish.scheduledDate = data.schedule.scheduledDate;
      }
      return dish;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch dish.");
    }
  }
);

export const fetchSchedules = createAsyncThunk(
  "dishes/fetchSchedules",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/menu/schedules");
      return (data.schedules as any[])
        .map(normaliseSchedule)
        .filter((s): s is MenuItem => s !== null);   // drop nulls, narrow type
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch schedules.");
    }
  }
);

export const addDishWithSchedule = createAsyncThunk(
  "dishes/addWithSchedule",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/dishes/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        dish:     normaliseDish(data.dish),
        schedule: data.schedule
          ? normaliseSchedule({ ...data.schedule, dish: data.dish })
          : null,
      };
    } catch (err: any) {
      if (err.response?.data?.scheduleError) {
        return rejectWithValue("Dish saved but that date is already taken. Pick another date.");
      }
      const msg = err.response?.data?.msg ?? err.message ?? "Failed to save dish.";
      return rejectWithValue(typeof msg === "string" ? msg : "Failed to save dish.");
    }
  }
);

export const updateDish = createAsyncThunk(
  "dishes/update",
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/admin/dishes/${id}/update`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const dish = normaliseDish(data.dish);
      if (data.schedule) {
        dish.scheduleId    = data.schedule._id;
        dish.scheduledDate = data.schedule.scheduledDate;
      }
      return dish;
    } catch (err: any) {
      if (err.response?.data?.scheduleError) {
        return rejectWithValue(err.response.data.msg);
      }
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update dish.");
    }
  }
);

export const deleteDish = createAsyncThunk(
  "dishes/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/dishes/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to delete dish.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const dishSlice = createSlice({
  name: "dishes",
  initialState: {
    items:       [] as MenuItem[],
    schedules:   [] as MenuItem[],
    editingDish: null as MenuItem | null,
    loading:     false,
    loadingOne:  false,
    saving:      false,
    error:       null as string | null,
  },
  reducers: {
    resetDishState(state) {
      state.saving = false;
      state.error  = null;
    },
    clearEditingDish(state) {
      state.editingDish = null;
    },
  },
  extraReducers: builder => {
    // fetchDishes
    builder.addCase(fetchDishes.pending,   s => { s.loading = true;  s.error = null; });
    builder.addCase(fetchDishes.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; });
    builder.addCase(fetchDishes.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // fetchDishById
    builder.addCase(fetchDishById.pending,   s => { s.loadingOne = true;  s.error = null; s.editingDish = null; });
    builder.addCase(fetchDishById.fulfilled, (s, a) => { s.loadingOne = false; s.editingDish = a.payload; });
    builder.addCase(fetchDishById.rejected,  (s, a) => { s.loadingOne = false; s.error = a.payload as string; });

    // fetchSchedules
    builder.addCase(fetchSchedules.pending,   s => { s.loading = true;  s.error = null; });
    builder.addCase(fetchSchedules.fulfilled, (s, a) => { s.loading = false; s.schedules = a.payload; });
    builder.addCase(fetchSchedules.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // addDishWithSchedule
    builder.addCase(addDishWithSchedule.pending,   s => { s.saving = true;  s.error = null; });
    builder.addCase(addDishWithSchedule.fulfilled, (s, a) => {
      s.saving = false;
      s.items.unshift(a.payload.dish);
      if (a.payload.schedule) s.schedules.unshift(a.payload.schedule);
    });
    builder.addCase(addDishWithSchedule.rejected, (s, a) => { s.saving = false; s.error = a.payload as string; });

    // updateDish
    builder.addCase(updateDish.pending,   s => { s.saving = true;  s.error = null; });
    builder.addCase(updateDish.fulfilled, (s, a) => {
      s.saving = false;
      const i = s.items.findIndex(d => String(d.id) === String(a.payload.id));
      if (i !== -1) s.items[i] = a.payload;
      const j = s.schedules.findIndex(d => String(d.id) === String(a.payload.id));
      if (j !== -1) s.schedules[j] = a.payload;
      s.editingDish = null;
    });
    builder.addCase(updateDish.rejected, (s, a) => { s.saving = false; s.error = a.payload as string; });

    // deleteDish
    builder.addCase(deleteDish.fulfilled, (s, a) => {
      s.items     = s.items.filter(d => String(d.id) !== a.payload);
      s.schedules = s.schedules.filter(d => String(d.id) !== a.payload);
    });
  },
});

export const { resetDishState, clearEditingDish } = dishSlice.actions;
export default dishSlice.reducer;