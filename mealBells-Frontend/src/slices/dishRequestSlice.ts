import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

// vendorId comes back as a populated object from the server after .populate()
export interface PopulatedVendor {
  _id:   string;
  name:  string;
  logo:  string;
  email: string;
}

export interface ForwardedVendor {
  vendorId:     PopulatedVendor;   // always populated — never a raw string
  vendorStatus: "pending" | "accepted" | "ignored";
  respondedAt:  string | null;
}

export interface AdminDishRequest {
  _id:               string;
  requestedDate:     string;
  dishSuggestion:    string;
  dietaryPreference: "Veg" | "Non-Veg" | "Both";
  spiceLevel:        "Mild" | "Normal" | "Spicy";
  status:            "pending" | "reviewed" | "approved" | "rejected";
  createdAt:         string;
  forwardedTo:       ForwardedVendor[];
  userId?: {
    _id:        string;
    name:       string;
    email:      string;
    avatar:     string;
    department: string;
  };
}

export interface VendorDishRequest {
  _id:               string;
  requestedDate:     string;
  dishSuggestion:    string;
  dietaryPreference: "Veg" | "Non-Veg" | "Both";
  spiceLevel:        "Mild" | "Normal" | "Spicy";
  vendorStatus:      "pending" | "accepted" | "ignored";
  respondedAt:       string | null;
  createdAt:         string;
  user: {
    _id:        string;
    name:       string;
    email:      string;
    avatar:     string;
    department: string;
  };
}

// ── Admin Thunks ──────────────────────────────────────────────────────────────

export const fetchAdminDishRequests = createAsyncThunk(
  "dishRequests/fetchAdmin",
  async (
    params: { status?: "pending" | "reviewed" | "all"; date?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/admin/dish-requests", { params });
      return data.data as AdminDishRequest[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch dish requests.");
    }
  }
);

export const forwardDishRequest = createAsyncThunk(
  "dishRequests/forward",
  async (
    { requestId, vendorIds }: { requestId: string; vendorIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post(
        `/admin/dish-requests/${requestId}/forward`,
        { vendorIds }
      );
      return data.data as AdminDishRequest;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to forward request.");
    }
  }
);

// ── Vendor Thunks ─────────────────────────────────────────────────────────────

export const fetchVendorDishRequests = createAsyncThunk(
  "dishRequests/fetchVendor",
  async (
    params: { status?: "pending" | "accepted" | "ignored" | "all" } = {},
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.get("/vendor/dish-requests", { params });
      return data.data as VendorDishRequest[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch dish requests.");
    }
  }
);

export const respondToVendorDishRequest = createAsyncThunk(
  "dishRequests/respond",
  async (
    { id, action }: { id: string; action: "accepted" | "ignored" },
    { rejectWithValue }
  ) => {
    try {
      await axiosInstance.patch(`/vendor/dish-requests/${id}/respond`, { action });
      return { id, action };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to respond to request.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const dishRequestSlice = createSlice({
  name: "dishRequests",
  initialState: {
    adminRequests:  [] as AdminDishRequest[],
    adminLoading:   false,
    adminError:     null as string | null,
    forwarding:     null as string | null,
    forwardError:   null as string | null,

    vendorRequests: [] as VendorDishRequest[],
    vendorLoading:  false,
    vendorError:    null as string | null,
    responding:     null as string | null,
    respondError:   null as string | null,
  },
  reducers: {
    clearAdminError(state)   { state.adminError   = null; },
    clearForwardError(state) { state.forwardError  = null; },
    clearVendorError(state)  { state.vendorError   = null; },
    clearRespondError(state) { state.respondError  = null; },
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchAdminDishRequests.pending,   (s) => { s.adminLoading = true;  s.adminError = null; })
      .addCase(fetchAdminDishRequests.fulfilled, (s, a) => { s.adminLoading = false; s.adminRequests = a.payload; })
      .addCase(fetchAdminDishRequests.rejected,  (s, a) => { s.adminLoading = false; s.adminError = a.payload as string; });

    builder
      .addCase(forwardDishRequest.pending,   (s, a) => { s.forwarding = a.meta.arg.requestId; s.forwardError = null; })
      .addCase(forwardDishRequest.fulfilled, (s, a) => {
        s.forwarding = null;
        const idx = s.adminRequests.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.adminRequests[idx] = a.payload;
      })
      .addCase(forwardDishRequest.rejected,  (s, a) => { s.forwarding = null; s.forwardError = a.payload as string; });

    builder
      .addCase(fetchVendorDishRequests.pending,   (s) => { s.vendorLoading = true;  s.vendorError = null; })
      .addCase(fetchVendorDishRequests.fulfilled, (s, a) => { s.vendorLoading = false; s.vendorRequests = a.payload; })
      .addCase(fetchVendorDishRequests.rejected,  (s, a) => { s.vendorLoading = false; s.vendorError = a.payload as string; });

    builder
      .addCase(respondToVendorDishRequest.pending,   (s, a) => { s.responding = a.meta.arg.id; s.respondError = null; })
      .addCase(respondToVendorDishRequest.fulfilled, (s, a) => {
        s.responding = null;
        const req = s.vendorRequests.find((r) => r._id === a.payload.id);
        if (req) req.vendorStatus = a.payload.action;
      })
      .addCase(respondToVendorDishRequest.rejected,  (s, a) => { s.responding = null; s.respondError = a.payload as string; });
  },
});

export const {
  clearAdminError,
  clearForwardError,
  clearVendorError,
  clearRespondError,
} = dishRequestSlice.actions;

export default dishRequestSlice.reducer;