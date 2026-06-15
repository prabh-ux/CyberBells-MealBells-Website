// slices/superAdmin/superAdminVendorSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SuperVendor {
  _id:            string;
  name:           string;
  email:          string;
  phone:          string;
  logo?:          string;
  capacity:       number;
  deliveryTiming: string;
  status:         boolean;
  active:         boolean;
  foodType:       "Veg" | "Non-Veg" | "Both" | "";
  rating:         number;
  totalReviews:   number;
  organizationId: { _id: string; name: string }[] | string[];
  createdAt:      string;
}

export interface NewVendorCredentials {
  name:     string;
  email:    string;
  password: string;
}

export type VendorStatusFilter   = "all" | "active" | "inactive";
export type VendorFoodTypeFilter = "all" | "Veg" | "Non-Veg" | "Both";

interface SuperVendorState {
  vendors:            SuperVendor[];
  loading:            boolean;
  error:              string | null;

  adding:             boolean;
  addError:           string | null;
  newVendorCredentials: NewVendorCredentials | null;

  toggling:           string | null;
  toggleError:        string | null;

  updating:           string | null;
  updateError:        string | null;

  deleting:           string | null;
  deleteError:        string | null;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperVendors = createAsyncThunk(
  "superVendors/fetch",
  async (
    { orgId, status, foodType }: { orgId: string; status: VendorStatusFilter; foodType: VendorFoodTypeFilter },
    { rejectWithValue }
  ) => {
    try {
      const p = new URLSearchParams({ status, foodType });
      if (orgId && orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/vendors?${p}`);
      return data.data as SuperVendor[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendors.");
    }
  }
);

export const addSuperVendor = createAsyncThunk(
  "superVendors/add",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/super-admin/vendors/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as { vendor: Pick<SuperVendor, "_id" | "name" | "email">; credentials: NewVendorCredentials };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to create vendor.");
    }
  }
);

export const toggleSuperVendorStatus = createAsyncThunk(
  "superVendors/toggleStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/super-admin/vendors/${id}/status`);
      return data.data as { _id: string; active: boolean };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to toggle status.");
    }
  }
);

export const updateSuperVendor = createAsyncThunk(
  "superVendors/update",
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/super-admin/vendors/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as SuperVendor;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update vendor.");
    }
  }
);

export const deleteSuperVendor = createAsyncThunk(
  "superVendors/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/super-admin/vendors/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to delete vendor.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superAdminVendorSlice = createSlice({
  name: "superVendors",
  initialState: {
    vendors:              [],
    loading:              false,
    error:                null,
    adding:               false,
    addError:             null,
    newVendorCredentials: null,
    toggling:             null,
    toggleError:          null,
    updating:             null,
    updateError:          null,
    deleting:             null,
    deleteError:          null,
  } as SuperVendorState,

  reducers: {
    clearSuperVendorErrors(state) {
      state.error       = null;
      state.addError    = null;
      state.toggleError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    clearNewSuperVendorCredentials(state) {
      state.newVendorCredentials = null;
    },
    optimisticToggleSuperVendor(state, { payload: id }: { payload: string }) {
      const v = state.vendors.find(v => v._id === id);
      if (v) v.active = !v.active;
    },
    revertToggleSuperVendor(state, { payload: { id, active } }: { payload: { id: string; active: boolean } }) {
      const v = state.vendors.find(v => v._id === id);
      if (v) v.active = active;
    },
  },

  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchSuperVendors.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchSuperVendors.fulfilled, (s, { payload }) => { s.loading = false; s.vendors = payload; })
      .addCase(fetchSuperVendors.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    // Add
    builder
      .addCase(addSuperVendor.pending,   (s) => { s.adding = true; s.addError = null; })
      .addCase(addSuperVendor.fulfilled, (s, { payload }) => {
        s.adding               = false;
        s.newVendorCredentials = payload.credentials;
      })
      .addCase(addSuperVendor.rejected,  (s, { payload }) => { s.adding = false; s.addError = payload as string; });

    // Toggle
    builder
      .addCase(toggleSuperVendorStatus.pending,   (s, { meta }) => { s.toggling = meta.arg; s.toggleError = null; })
      .addCase(toggleSuperVendorStatus.fulfilled, (s, { payload }) => {
        s.toggling = null;
        const v = s.vendors.find(v => v._id === payload._id);
        if (v) v.active = payload.active;
      })
      .addCase(toggleSuperVendorStatus.rejected,  (s, { payload }) => { s.toggling = null; s.toggleError = payload as string; });

    // Update
    builder
      .addCase(updateSuperVendor.pending,   (s, { meta }) => { s.updating = meta.arg.id; s.updateError = null; })
      .addCase(updateSuperVendor.fulfilled, (s, { payload }) => {
        s.updating = null;
        const idx = s.vendors.findIndex(v => v._id === payload._id);
        if (idx !== -1) s.vendors[idx] = payload;
      })
      .addCase(updateSuperVendor.rejected,  (s, { payload }) => { s.updating = null; s.updateError = payload as string; });

    // Delete
    builder
      .addCase(deleteSuperVendor.pending,   (s, { meta }) => { s.deleting = meta.arg; s.deleteError = null; })
      .addCase(deleteSuperVendor.fulfilled, (s, { payload: id }) => {
        s.deleting = null;
        s.vendors  = s.vendors.filter(v => v._id !== id);
      })
      .addCase(deleteSuperVendor.rejected,  (s, { payload }) => { s.deleting = null; s.deleteError = payload as string; });
  },
});

export const {
  clearSuperVendorErrors,
  clearNewSuperVendorCredentials,
  optimisticToggleSuperVendor,
  revertToggleSuperVendor,
} = superAdminVendorSlice.actions;

export default superAdminVendorSlice.reducer;