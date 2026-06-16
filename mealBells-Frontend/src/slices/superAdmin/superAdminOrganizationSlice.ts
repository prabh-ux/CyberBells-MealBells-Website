// slices/superAdmin/superAdminOrganizationSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SuperOrganization {
  _id:               string;
  companyName:       string;
  contactEmail:      string;
  officeAddress:     string;
  mealTime:          string;
  cutoffTime:        string;
  allowDishRequests: boolean;
  capacity:          number;
  status:            boolean;
  userCount:         number;
  createdBy?:        { _id: string; name: string; email: string } | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface OrgSummary {
  total:    number;
  active:   number;
  inactive: number;
}

export interface OrgPagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export type OrgSortBy  = "name" | "users" | "createdAt";
export type OrgSortDir = "asc" | "desc";
export type OrgStatus  = "all" | "active" | "inactive";

export interface OrgFilters {
  search:  string;
  status:  OrgStatus;
  sortBy:  OrgSortBy;
  sortDir: OrgSortDir;
  page:    number;
  limit:   number;
}

export const DEFAULT_ORG_FILTERS: OrgFilters = {
  search:  "",
  status:  "all",
  sortBy:  "createdAt",
  sortDir: "desc",
  page:    1,
  limit:   20,
};

interface SuperOrgState {
  organizations: SuperOrganization[];
  summary:       OrgSummary | null;
  pagination:    OrgPagination | null;
  filters:       OrgFilters;

  loading:       boolean;
  error:         string | null;

  creating:      boolean;
  createError:   string | null;

  updating:      string | null;   // org _id being updated
  updateError:   string | null;

  toggling:      string | null;
  toggleError:   string | null;

  deleting:      string | null;
  deleteError:   string | null;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperOrganizations = createAsyncThunk(
  "superOrgs/fetch",
  async (filters: OrgFilters, { rejectWithValue }) => {
    try {
      const p = new URLSearchParams({
        search:  filters.search,
        status:  filters.status,
        sortBy:  filters.sortBy,
        sortDir: filters.sortDir,
        page:    String(filters.page),
        limit:   String(filters.limit),
      });
      const { data } = await axiosInstance.get(`/super-admin/organizations?${p}`);
      return data.data as {
        organizations: SuperOrganization[];
        pagination:    OrgPagination;
        summary:       OrgSummary;
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch organizations.");
    }
  }
);

export const createSuperOrganization = createAsyncThunk(
  "superOrgs/create",
  async (body: Partial<SuperOrganization>, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/super-admin/organizations", body);
      return data.data as SuperOrganization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to create organization.");
    }
  }
);

export const updateSuperOrganization = createAsyncThunk(
  "superOrgs/update",
  async ({ id, body }: { id: string; body: Partial<SuperOrganization> }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/super-admin/organizations/${id}`, body);
      return data.data as SuperOrganization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update organization.");
    }
  }
);

export const toggleSuperOrganizationStatus = createAsyncThunk(
  "superOrgs/toggleStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/super-admin/organizations/${id}/status`);
      return data.data as { _id: string; status: boolean };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to toggle status.");
    }
  }
);

export const deleteSuperOrganization = createAsyncThunk(
  "superOrgs/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/super-admin/organizations/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to delete organization.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superAdminOrganizationSlice = createSlice({
  name: "superOrgs",
  initialState: {
    organizations: [],
    summary:       null,
    pagination:    null,
    filters:       DEFAULT_ORG_FILTERS,
    loading:       false,
    error:         null,
    creating:      false,
    createError:   null,
    updating:      null,
    updateError:   null,
    toggling:      null,
    toggleError:   null,
    deleting:      null,
    deleteError:   null,
  } as SuperOrgState,

  reducers: {
    setOrgFilters(state, { payload }: { payload: Partial<OrgFilters> }) {
      state.filters = { ...state.filters, ...payload, page: payload.page ?? 1 };
    },
    resetOrgFilters(state) {
      state.filters = { ...DEFAULT_ORG_FILTERS };
    },
    clearOrgErrors(state) {
      state.error       = null;
      state.createError = null;
      state.updateError = null;
      state.toggleError = null;
      state.deleteError = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch list
    builder
      .addCase(fetchSuperOrganizations.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSuperOrganizations.fulfilled, (s, { payload }) => {
        s.loading       = false;
        s.organizations = payload.organizations;
        s.pagination    = payload.pagination;
        s.summary       = payload.summary;
      })
      .addCase(fetchSuperOrganizations.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    // Create
    builder
      .addCase(createSuperOrganization.pending,   (s) => { s.creating = true; s.createError = null; })
      .addCase(createSuperOrganization.fulfilled, (s, { payload }) => {
        s.creating = false;
        s.organizations.unshift(payload);
        if (s.summary) s.summary.total += 1;
        if (payload.status && s.summary) s.summary.active += 1;
      })
      .addCase(createSuperOrganization.rejected,  (s, { payload }) => { s.creating = false; s.createError = payload as string; });

    // Update
    builder
      .addCase(updateSuperOrganization.pending,   (s, { meta }) => { s.updating = meta.arg.id; s.updateError = null; })
      .addCase(updateSuperOrganization.fulfilled, (s, { payload }) => {
        s.updating = null;
        const idx = s.organizations.findIndex(o => o._id === payload._id);
        if (idx !== -1) s.organizations[idx] = { ...s.organizations[idx], ...payload };
      })
      .addCase(updateSuperOrganization.rejected,  (s, { payload }) => { s.updating = null; s.updateError = payload as string; });

    // Toggle status
    builder
      .addCase(toggleSuperOrganizationStatus.pending,   (s, { meta }) => { s.toggling = meta.arg; s.toggleError = null; })
      .addCase(toggleSuperOrganizationStatus.fulfilled, (s, { payload }) => {
        s.toggling = null;
        const org = s.organizations.find(o => o._id === payload._id);
        if (org) {
          const wasActive = org.status;
          org.status = payload.status;
          if (s.summary) {
            if (wasActive && !payload.status) { s.summary.active -= 1; s.summary.inactive += 1; }
            if (!wasActive && payload.status) { s.summary.active += 1; s.summary.inactive -= 1; }
          }
        }
      })
      .addCase(toggleSuperOrganizationStatus.rejected,  (s, { payload }) => { s.toggling = null; s.toggleError = payload as string; });

    // Delete
    builder
      .addCase(deleteSuperOrganization.pending,   (s, { meta }) => { s.deleting = meta.arg; s.deleteError = null; })
      .addCase(deleteSuperOrganization.fulfilled, (s, { payload: id }) => {
        const org = s.organizations.find(o => o._id === id);
        if (org && s.summary) {
          s.summary.total -= 1;
          if (org.status) s.summary.active -= 1; else s.summary.inactive -= 1;
        }
        s.deleting       = null;
        s.organizations  = s.organizations.filter(o => o._id !== id);
      })
      .addCase(deleteSuperOrganization.rejected,  (s, { payload }) => { s.deleting = null; s.deleteError = payload as string; });
  },
});

export const { setOrgFilters, resetOrgFilters, clearOrgErrors } = superAdminOrganizationSlice.actions;
export default superAdminOrganizationSlice.reducer;