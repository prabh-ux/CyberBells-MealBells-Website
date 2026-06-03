import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Organization {
  _id?:              string;
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  mealTime:          string;   // "HH:mm" 24-hour
  cutoffTime:        string;   // "HH:mm" 24-hour — attendance locked after this
  allowDishRequests: boolean;
}

export type OrgUpdatePayload = Omit<Organization, "_id">;

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Admin: fetch own org via /organization/me */
export const fetchOrganization = createAsyncThunk(
  "organization/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/organization/me");
      return data.organization as Organization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch organization");
    }
  }
);

/** User: fetch their linked org settings via /user/organization */
export const fetchUserOrganization = createAsyncThunk(
  "organization/fetchForUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/user/organization");
      return data.organization as Organization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch organization settings");
    }
  }
);

/** Admin: update org settings */
export const updateOrganization = createAsyncThunk(
  "organization/updateMe",
  async (payload: OrgUpdatePayload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put("/organization/me/update", payload);
      return data.organization as Organization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update organization");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const organizationSlice = createSlice({
  name: "organization",
  initialState: {
    data:        null as Organization | null,
    loading:     false,
    saving:      false,
    error:       null as string | null,
  },
  reducers: {
    clearOrgError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {

    // ── fetchOrganization (admin) ─────────────────────────────────────────────
    builder.addCase(fetchOrganization.pending, (state) => {
      state.loading = true;
      state.error   = null;
    });
    builder.addCase(fetchOrganization.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.data    = payload;
    });
    builder.addCase(fetchOrganization.rejected, (state, { payload }) => {
      state.loading = false;
      state.error   = payload as string;
    });

    // ── fetchUserOrganization (user) ──────────────────────────────────────────
    // Reuses the same `data` field — both point to the same org object.
    // Uses separate loading flag so user pages don't conflict with admin pages.
    builder.addCase(fetchUserOrganization.pending, (state) => {
      state.loading = true;
      state.error   = null;
    });
    builder.addCase(fetchUserOrganization.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.data    = payload;
    });
    builder.addCase(fetchUserOrganization.rejected, (state, { payload }) => {
      state.loading = false;
      state.error   = payload as string;
    });

    // ── updateOrganization (admin) ────────────────────────────────────────────
    builder.addCase(updateOrganization.pending, (state) => {
      state.saving = true;
      state.error  = null;
    });
    builder.addCase(updateOrganization.fulfilled, (state, { payload }) => {
      state.saving = false;
      state.data   = payload;
    });
    builder.addCase(updateOrganization.rejected, (state, { payload }) => {
      state.saving = false;
      state.error  = payload as string;
    });

  },
});

export const { clearOrgError } = organizationSlice.actions;
export default organizationSlice.reducer;