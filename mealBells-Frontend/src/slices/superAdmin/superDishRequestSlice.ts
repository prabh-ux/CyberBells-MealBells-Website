// slices/superAdmin/superDishRequestSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ForwardedVendor {
  vendorId:     { _id: string; name: string; logo?: string; email?: string } | string;
  vendorStatus: "pending" | "accepted" | "ignored";
  respondedAt:  string | null;
}

export interface SuperDishRequest {
  _id:               string;
  userId:            { _id: string; name: string; email: string; avatar?: string; department?: string } | null;
  dishSuggestion:    string;
  dietaryPreference: string;
  spiceLevel:        string;
  requestedDate:     string;
  status:            "pending" | "reviewed" | "approved" | "rejected";
  forwardedTo:       ForwardedVendor[];
  createdAt:         string;
}

export interface SuperDishRequestVendor {
  _id:   string;
  name:  string;
  logo?: string;
  email?: string;
}

export type StatusFilter = "pending" | "reviewed" | "all";

interface SuperDishRequestState {
  requests:        SuperDishRequest[];
  requestsLoading: boolean;
  requestsError:   string | null;

  vendors:         SuperDishRequestVendor[];
  vendorsLoading:  boolean;
  vendorsError:    string | null;

  forwarding:      string | null;   // request _id currently being forwarded
  forwardError:    string | null;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperDishRequests = createAsyncThunk(
  "superDishRequests/fetchRequests",
  async (
    { orgId, status }: { orgId: string; status: StatusFilter },
    { rejectWithValue }
  ) => {
    try {
      const p = new URLSearchParams({ status });
      if (orgId && orgId !== "all") p.set("orgId", orgId);
      const { data } = await axiosInstance.get(`/super-admin/dish-requests?${p}`);
      return data.data as SuperDishRequest[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch dish requests.");
    }
  }
);

export const fetchSuperDishRequestVendors = createAsyncThunk(
  "superDishRequests/fetchVendors",
  async (orgId: string, { rejectWithValue }) => {
    try {
      if (!orgId || orgId === "all") return [] as SuperDishRequestVendor[];
      const { data } = await axiosInstance.get(
        `/super-admin/dish-requests/vendors?orgId=${orgId}`
      );
      return data.data as SuperDishRequestVendor[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendors.");
    }
  }
);

export const superForwardDishRequest = createAsyncThunk(
  "superDishRequests/forward",
  async (
    { requestId, vendorIds }: { requestId: string; vendorIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post(
        `/super-admin/dish-requests/${requestId}/forward`,
        { vendorIds }
      );
      return data.data as SuperDishRequest;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to forward request.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superDishRequestSlice = createSlice({
  name: "superDishRequests",
  initialState: {
    requests:        [],
    requestsLoading: false,
    requestsError:   null,

    vendors:         [],
    vendorsLoading:  false,
    vendorsError:    null,

    forwarding:      null,
    forwardError:    null,
  } as SuperDishRequestState,

  reducers: {
    clearSuperDishRequestVendors(state) {
      state.vendors      = [];
      state.vendorsError = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch requests
    builder
      .addCase(fetchSuperDishRequests.pending, (s) => {
        s.requestsLoading = true;
        s.requestsError   = null;
      })
      .addCase(fetchSuperDishRequests.fulfilled, (s, { payload }) => {
        s.requestsLoading = false;
        s.requests        = payload;
      })
      .addCase(fetchSuperDishRequests.rejected, (s, { payload }) => {
        s.requestsLoading = false;
        s.requestsError   = payload as string;
      });

    // Fetch vendors
    builder
      .addCase(fetchSuperDishRequestVendors.pending, (s) => {
        s.vendorsLoading = true;
        s.vendorsError   = null;
      })
      .addCase(fetchSuperDishRequestVendors.fulfilled, (s, { payload }) => {
        s.vendorsLoading = false;
        s.vendors        = payload;
      })
      .addCase(fetchSuperDishRequestVendors.rejected, (s, { payload }) => {
        s.vendorsLoading = false;
        s.vendorsError   = payload as string;
      });

    // Forward request
    builder
      .addCase(superForwardDishRequest.pending, (s, { meta }) => {
        s.forwarding   = meta.arg.requestId;
        s.forwardError = null;
      })
      .addCase(superForwardDishRequest.fulfilled, (s, { payload }) => {
        s.forwarding = null;
        // Update the request in the list in-place
        const idx = s.requests.findIndex((r) => r._id === payload._id);
        if (idx !== -1) s.requests[idx] = payload;
      })
      .addCase(superForwardDishRequest.rejected, (s, { payload }) => {
        s.forwarding   = null;
        s.forwardError = payload as string;
      });
  },
});

export const { clearSuperDishRequestVendors } = superDishRequestSlice.actions;
export default superDishRequestSlice.reducer;
