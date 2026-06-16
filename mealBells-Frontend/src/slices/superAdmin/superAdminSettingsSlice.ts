import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformDefaults {
  defaultMealTime:          string;
  defaultCutoffTime:        string;
  defaultCapacity:          number;
  defaultBillingPlan:       "starter" | "pro" | "enterprise";
  defaultAllowDishRequests: boolean;
}

export interface PlatformLimits {
  maxOrgsPerVendor:    number;
  maxMembersPerOrg:    number;
  maxDishRequestsPerDay: number;
  attendanceLockHours: number;
}

export interface FeatureFlags {
  vendorOnboarding:      boolean;
  selfServeOrgCreation:  boolean;
  emailNotifications:    boolean;
  maintenanceMode:       boolean;
}

export interface PlatformMeta {
  supportEmail:    string;
  platformVersion: string;
}

export interface PlatformStats {
  totalVendors:  number;
  totalOrgs:     number;
  totalMembers:  number;
}

export interface SuperAdminSettings {
  defaults: PlatformDefaults;
  limits:   PlatformLimits;
  flags:    FeatureFlags;
  meta:     PlatformMeta;
  stats:    PlatformStats;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperAdminSettings = createAsyncThunk(
  "superAdmin/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/super-admin/settings");
      return data.settings as SuperAdminSettings;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch settings");
    }
  }
);

export const updateSuperAdminSettings = createAsyncThunk(
  "superAdmin/updateSettings",
  async (
    payload: {
      defaults?: Partial<PlatformDefaults>;
      limits?:   Partial<PlatformLimits>;
      flags?:    Partial<FeatureFlags>;
      meta?:     Partial<PlatformMeta>;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.put("/super-admin/settings", payload);
      return data.settings as SuperAdminSettings;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update settings");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULT: SuperAdminSettings = {
  defaults: {
    defaultMealTime:          "12:30",
    defaultCutoffTime:        "09:00",
    defaultCapacity:          50,
    defaultBillingPlan:       "pro",
    defaultAllowDishRequests: true,
  },
  limits: {
    maxOrgsPerVendor:      20,
    maxMembersPerOrg:      500,
    maxDishRequestsPerDay: 10,
    attendanceLockHours:   3,
  },
  flags: {
    vendorOnboarding:     true,
    selfServeOrgCreation: true,
    emailNotifications:   true,
    maintenanceMode:      false,
  },
  meta: {
    supportEmail:    "",
    platformVersion: "",
  },
  stats: {
    totalVendors: 0,
    totalOrgs:    0,
    totalMembers: 0,
  },
};

const superAdminSlice = createSlice({
  name: "superAdminSettings",
  initialState: {
    settings: SETTINGS_DEFAULT,
    loading:  false,
    saving:   false,
    error:    null as string | null,
  },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperAdminSettings.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchSuperAdminSettings.fulfilled, (s, { payload }) => { s.loading = false; s.settings = payload; })
      .addCase(fetchSuperAdminSettings.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    builder
      .addCase(updateSuperAdminSettings.pending,   (s) => { s.saving = true;  s.error = null; })
      .addCase(updateSuperAdminSettings.fulfilled, (s, { payload }) => { s.saving = false; s.settings = payload; })
      .addCase(updateSuperAdminSettings.rejected,  (s, { payload }) => { s.saving = false; s.error = payload as string; });
  },
});

export const { clearError } = superAdminSlice.actions;
export default superAdminSlice.reducer;