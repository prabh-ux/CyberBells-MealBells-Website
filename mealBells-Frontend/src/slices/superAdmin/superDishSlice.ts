// slices/superAdmin/superDishSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";
import type { MenuItem } from "../../types/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SuperMenuVendor {
  _id:   string;
  name:  string;
  logo?: string;
  email?: string;
}

// ── Normalisers (mirrors admin dishSlice) ─────────────────────────────────────

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
  if (!s?.dish) return null;
  return {
    ...normaliseDish(s.dish),
    scheduleId:    s._id,
    scheduledDate: s.scheduledDate,
  };
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperSchedules = createAsyncThunk(
  "superDish/fetchSchedules",
  async (orgId: string, { rejectWithValue }) => {
    try {
      const p = new URLSearchParams();
      if (orgId && orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/menu/schedules?${p}`);
      return (data.schedules as any[])
        .map(normaliseSchedule)
        .filter((s): s is MenuItem => s !== null);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch schedules.");
    }
  }
);

export const fetchSuperDishById = createAsyncThunk(
  "superDish/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/super-admin/dishes/${id}`);
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

export const fetchSuperMenuVendors = createAsyncThunk(
  "superDish/fetchVendors",
  async (orgId: string, { rejectWithValue }) => {
    try {
      if (!orgId || orgId === "all") return [] as SuperMenuVendor[];
      const { data } = await axiosInstance.get(`/super-admin/menu/vendors?orgId=${orgId}`);
      return data.vendors as SuperMenuVendor[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendors.");
    }
  }
);

export const addSuperDishWithSchedule = createAsyncThunk(
  "superDish/add",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/super-admin/dishes/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        dish:     normaliseDish(data.dish),
        schedule: data.schedule
          ? normaliseSchedule({ ...data.schedule, dish: data.dish })
          : null,
      };
    } catch (err: any) {
      if (err.response?.data?.scheduleError)
        return rejectWithValue("Dish saved but that date is already taken. Pick another date.");
      return rejectWithValue(err.response?.data?.msg ?? "Failed to save dish.");
    }
  }
);

export const updateSuperDish = createAsyncThunk(
  "superDish/update",
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/super-admin/dishes/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const dish = normaliseDish(data.dish);
      if (data.schedule) {
        dish.scheduleId    = data.schedule._id;
        dish.scheduledDate = data.schedule.scheduledDate;
      }
      return dish;
    } catch (err: any) {
      if (err.response?.data?.scheduleError)
        return rejectWithValue(err.response.data.msg);
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update dish.");
    }
  }
);

export const deleteSuperDish = createAsyncThunk(
  "superDish/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/super-admin/dishes/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to delete dish.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superDishSlice = createSlice({
  name: "superDish",
  initialState: {
    schedules:      [] as MenuItem[],
    editingDish:    null as MenuItem | null,
    loading:        false,
    loadingOne:     false,
    saving:         false,
    deleting:       null as string | null,
    error:          null as string | null,

    menuVendors:        [] as SuperMenuVendor[],
    menuVendorsLoading: false,
  },
  reducers: {
    resetSuperDishState(state) {
      state.saving = false;
      state.error  = null;
    },
    clearSuperEditingDish(state) {
      state.editingDish = null;
    },
    clearSuperMenuVendors(state) {
      state.menuVendors = [];
    },
  },
  extraReducers: builder => {
    // fetchSuperSchedules
    builder
      .addCase(fetchSuperSchedules.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchSuperSchedules.fulfilled, (s, a) => { s.loading = false; s.schedules = a.payload; })
      .addCase(fetchSuperSchedules.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // fetchSuperDishById
    builder
      .addCase(fetchSuperDishById.pending,   s => { s.loadingOne = true;  s.error = null; s.editingDish = null; })
      .addCase(fetchSuperDishById.fulfilled, (s, a) => { s.loadingOne = false; s.editingDish = a.payload; })
      .addCase(fetchSuperDishById.rejected,  (s, a) => { s.loadingOne = false; s.error = a.payload as string; });

    // fetchSuperMenuVendors
    builder
      .addCase(fetchSuperMenuVendors.pending,   s => { s.menuVendorsLoading = true; })
      .addCase(fetchSuperMenuVendors.fulfilled, (s, a) => { s.menuVendorsLoading = false; s.menuVendors = a.payload; })
      .addCase(fetchSuperMenuVendors.rejected,  s => { s.menuVendorsLoading = false; });

    // addSuperDishWithSchedule
    builder
      .addCase(addSuperDishWithSchedule.pending,   s => { s.saving = true;  s.error = null; })
      .addCase(addSuperDishWithSchedule.fulfilled, (s, a) => {
        s.saving = false;
        if (a.payload.schedule) s.schedules.unshift(a.payload.schedule);
      })
      .addCase(addSuperDishWithSchedule.rejected, (s, a) => { s.saving = false; s.error = a.payload as string; });

    // updateSuperDish
    builder
      .addCase(updateSuperDish.pending,   s => { s.saving = true;  s.error = null; })
      .addCase(updateSuperDish.fulfilled, (s, a) => {
        s.saving      = false;
        s.editingDish = null;
        const j = s.schedules.findIndex(d => String(d.id) === String(a.payload.id));
        if (j !== -1) s.schedules[j] = a.payload;
      })
      .addCase(updateSuperDish.rejected, (s, a) => { s.saving = false; s.error = a.payload as string; });

    // deleteSuperDish
    builder
      .addCase(deleteSuperDish.pending,   (s, a) => { s.deleting = a.meta.arg; })
      .addCase(deleteSuperDish.fulfilled, (s, a) => {
        s.deleting  = null;
        s.schedules = s.schedules.filter(d => String(d.id) !== a.payload);
      })
      .addCase(deleteSuperDish.rejected,  s => { s.deleting = null; });
  },
});

export const {
  resetSuperDishState,
  clearSuperEditingDish,
  clearSuperMenuVendors,
} = superDishSlice.actions;

export default superDishSlice.reducer;