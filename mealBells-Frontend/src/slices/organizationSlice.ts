import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

export interface Organization {
  _id?:          string;
  companyName:   string;
  contactEmail:  string;
  officeAddress: string;
}

// ── GET
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

// ── PUT
export const updateOrganization = createAsyncThunk(
  "organization/updateMe",
  async (payload: Omit<Organization, "_id">, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put("/organization/me/update", payload);
      return data.organization as Organization;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update organization");
    }
  }
);

// ── Slice
const organizationSlice = createSlice({
  name: "organization",
  initialState: {
    data:    null as Organization | null,
    loading: false,
    saving:  false,
    error:   null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {

    // fetch
    builder.addCase(fetchOrganization.pending, (state) => {
      state.loading = true;
      state.error   = null;
    });
    builder.addCase(fetchOrganization.fulfilled, (state, action) => {
      state.loading = false;
      state.data    = action.payload;
    });
    builder.addCase(fetchOrganization.rejected, (state, action) => {
      state.loading = false;
      state.error   = action.payload as string;
    });

    // update
    builder.addCase(updateOrganization.pending, (state) => {
      state.saving = true;
      state.error  = null;
    });
    builder.addCase(updateOrganization.fulfilled, (state, action) => {
      state.saving = false;
      state.data   = action.payload;
    });
    builder.addCase(updateOrganization.rejected, (state, action) => {
      state.saving = false;
      state.error  = action.payload as string;
    });

  },
});

export default organizationSlice.reducer;