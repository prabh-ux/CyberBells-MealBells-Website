import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Organization {
  _id?:              string;
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  mealTime:          string;
  cutoffTime:        string;
  allowDishRequests: boolean;
  capacity:          number;   // ← new
}

export type OrgUpdatePayload = Omit<Organization, "_id">;

// ── Vendor-managed org types ──────────────────────────────────────────────────

export interface OrgAdmin {
  _id:   string;
  name:  string;
  email: string;
}

export interface VendorOrg {
  _id:               string;
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  cutoffTime:        string;
  mealTime:          string;
  allowDishRequests: boolean;
  capacity:          number;   // ← new
  status:            boolean;
  memberCount:       number;
  admin:             OrgAdmin | null;
  createdAt:         string;
}

export interface NewOrgCredentials {
  orgName:       string;
  adminName:     string;
  adminEmail:    string;
  adminPassword: string;
}

export interface CreateOrgPayload {
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  mealTime:          string;
  cutoffTime:        string;
  allowDishRequests: boolean;
  capacity:          number;   // ← new
  adminName:         string;
  adminEmail:        string;
  adminPhone?:       string;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Admin: fetch own org */
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

/** User: fetch their linked org settings */
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

/** Vendor: fetch all orgs they created */
export const fetchVendorOrgs = createAsyncThunk(
  "organization/fetchVendorOrgs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/vendor/organizations");
      return data.data as VendorOrg[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch organizations");
    }
  }
);

/** Vendor: create a new org + admin user */
export const createVendorOrg = createAsyncThunk(
  "organization/createVendorOrg",
  async (payload: CreateOrgPayload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/vendor/organizations", payload);
      return data.data as { org: VendorOrg; credentials: NewOrgCredentials };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to create organization");
    }
  }
);

/** Vendor: toggle org active status */
export const toggleVendorOrgStatus = createAsyncThunk(
  "organization/toggleStatus",
  async ({ id, currentStatus }: { id: string; currentStatus: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/vendor/organizations/${id}/toggle-status`);
      return { id, status: !currentStatus, msg: data.msg } as { id: string; status: boolean; msg: string };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to toggle status");
    }
  }
);

/** Vendor: update org */
export const updateVendorOrg = createAsyncThunk(   // ← new
  "organization/updateVendorOrg",
  async ({ id, payload }: { id: string; payload: Partial<CreateOrgPayload> }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/vendor/organizations/${id}`, payload);
      return data.data as VendorOrg;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update organization");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const organizationSlice = createSlice({
  name: "organization",
  initialState: {
    // admin/user org
    data:    null as Organization | null,
    loading: false,
    saving:  false,
    error:   null as string | null,

    // vendor org management
    vendorOrgs:        [] as VendorOrg[],
    vendorOrgsLoading: false,
    vendorOrgsError:   null as string | null,
    creating:          false,
    createError:       null as string | null,
    newOrgCredentials: null as NewOrgCredentials | null,
    updating:          false,   // ← new
    updateError:       null as string | null,   // ← new
  },
  reducers: {
    clearOrgError(state)          { state.error = null; },
    clearVendorOrgsError(state)   { state.vendorOrgsError = null; },
    clearCreateError(state)       { state.createError = null; },
    clearUpdateError(state)       { state.updateError = null; },   // ← new
    clearNewOrgCredentials(state) { state.newOrgCredentials = null; },
    optimisticToggleOrg(state, { payload: id }: { payload: string }) {
      const org = state.vendorOrgs.find(o => o._id === id);
      if (org) org.status = !org.status;
    },
    revertToggleOrg(state, { payload }: { payload: { id: string; status: boolean } }) {
      const org = state.vendorOrgs.find(o => o._id === payload.id);
      if (org) org.status = payload.status;
    },
  },
  extraReducers: (builder) => {

    // fetchOrganization
    builder
      .addCase(fetchOrganization.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchOrganization.fulfilled, (s, { payload }) => { s.loading = false; s.data = payload; })
      .addCase(fetchOrganization.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    // fetchUserOrganization
    builder
      .addCase(fetchUserOrganization.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchUserOrganization.fulfilled, (s, { payload }) => { s.loading = false; s.data = payload; })
      .addCase(fetchUserOrganization.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    // updateOrganization
    builder
      .addCase(updateOrganization.pending,   (s) => { s.saving = true;  s.error = null; })
      .addCase(updateOrganization.fulfilled, (s, { payload }) => { s.saving = false; s.data = payload; })
      .addCase(updateOrganization.rejected,  (s, { payload }) => { s.saving = false; s.error = payload as string; });

    // fetchVendorOrgs
    builder
      .addCase(fetchVendorOrgs.pending,   (s) => { s.vendorOrgsLoading = true;  s.vendorOrgsError = null; })
      .addCase(fetchVendorOrgs.fulfilled, (s, { payload }) => { s.vendorOrgsLoading = false; s.vendorOrgs = payload; })
      .addCase(fetchVendorOrgs.rejected,  (s, { payload }) => { s.vendorOrgsLoading = false; s.vendorOrgsError = payload as string; });

    // createVendorOrg
    builder
      .addCase(createVendorOrg.pending,   (s) => { s.creating = true;  s.createError = null; })
      .addCase(createVendorOrg.fulfilled, (s, { payload }) => {
        s.creating          = false;
        s.newOrgCredentials = payload.credentials;
        s.vendorOrgs.unshift(payload.org);
      })
      .addCase(createVendorOrg.rejected,  (s, { payload }) => { s.creating = false; s.createError = payload as string; });

    // updateVendorOrg  ← new
    builder
      .addCase(updateVendorOrg.pending,   (s) => { s.updating = true;  s.updateError = null; })
      .addCase(updateVendorOrg.fulfilled, (s, { payload }) => {
        s.updating = false;
        const idx = s.vendorOrgs.findIndex(o => o._id === payload._id);
        if (idx !== -1) s.vendorOrgs[idx] = payload;
      })
      .addCase(updateVendorOrg.rejected,  (s, { payload }) => { s.updating = false; s.updateError = payload as string; });

    // toggleVendorOrgStatus
    builder
      .addCase(toggleVendorOrgStatus.fulfilled, (s, { payload }) => {
        const org = s.vendorOrgs.find(o => o._id === payload.id);
        if (org) org.status = payload.status;
      });
  },
});

export const {
  clearOrgError,
  clearVendorOrgsError,
  clearCreateError,
  clearUpdateError,
  clearNewOrgCredentials,
  optimisticToggleOrg,
  revertToggleOrg,
} = organizationSlice.actions;

export default organizationSlice.reducer;