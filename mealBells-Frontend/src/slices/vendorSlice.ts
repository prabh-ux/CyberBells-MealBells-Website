import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";
import type { EditVendorForm, Vendor } from "../types/admin";

export const fetchVendors = createAsyncThunk(
  "vendors/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/vendors");
      return data.vendors as Vendor[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch vendors.");
    }
  }
);

export const addVendor = createAsyncThunk(
  "vendors/addVendor",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/vendors/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.vendor as Vendor;
    } catch (err: any) {
      const msg =
        err.response?.data?.msg ??
        err.response?.data?.message ??
        err.message ??
        "Something went wrong";
      return rejectWithValue(typeof msg === "string" ? msg : "Failed to add vendor.");
    }
  }
);

export const toggleVendorStatus = createAsyncThunk(
  "vendors/toggleStatus",
  async ({ id, currentStatus }: { id: string; currentStatus: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/vendor/${id}/status`, {
        active: currentStatus,
      });
      return {
        id,
        status: data.vendor.status as boolean,
        msg:    data.msg ?? "Status updated!",
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update status.");
    }
  }
);

export const updateVendor = createAsyncThunk(
  "vendors/updateVendor",
  async ({ id, form, file }: { id: string; form: EditVendorForm; file?: File }, { rejectWithValue }) => {
    try {
      const payload = new FormData();
      payload.append("name",     form.name);
      payload.append("email",    form.email);
      payload.append("phone",    form.phone);
      payload.append("capacity", form.capacity);
      payload.append("delivery", form.deliveryTiming);
      payload.append("foodType", form.foodType);
      if (file) payload.append("logo", file);

      const { data } = await axiosInstance.put(`/admin/vendor/${id}/update`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        id,
        name:           data.vendor.name,
        email:          data.vendor.email,
        phone:          data.vendor.phone          ?? "",
        capacity:       data.vendor.capacity       ?? 0,
        deliveryTiming: data.vendor.deliveryTiming ?? "",
        foodType:       data.vendor.foodType       ?? "",
        logo:           data.vendor.logo,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update vendor.");
    }
  }
);

const vendorSlice = createSlice({
  name: "vendors",
  initialState: {
    list:     [] as Vendor[],
    loading:  false,
    adding:   false,
    updating: false,
    toggling: null as string | null,  // holds the id being toggled
    error:    null as string | null,
  },
  reducers: {
    resetVendorState(state) {
      state.adding  = false;
      state.error   = null;
    },
    optimisticToggleVendor(state, action: { payload: string }) {
      const v = state.list.find(v => v._id === action.payload);
      if (v) v.status = !v.status;
    },
    revertToggleVendor(state, action: { payload: { id: string; status: boolean } }) {
      const v = state.list.find(v => v._id === action.payload.id);
      if (v) v.status = action.payload.status;
    },
  },
  extraReducers: builder => {
    // fetchVendors
    builder.addCase(fetchVendors.pending,   state => { state.loading = true;  state.error = null; });
    builder.addCase(fetchVendors.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; });
    builder.addCase(fetchVendors.rejected,  (state, action) => { state.loading = false; state.error = action.payload as string; });

    // addVendor
    builder.addCase(addVendor.pending,   state => { state.adding = true;  state.error = null; });
    builder.addCase(addVendor.fulfilled, (state, action) => { state.adding = false; state.list.unshift(action.payload); });
    builder.addCase(addVendor.rejected,  (state, action) => { state.adding = false; state.error = action.payload as string; });

    // toggleVendorStatus
    builder.addCase(toggleVendorStatus.pending,   (state, action) => { state.toggling = action.meta.arg.id; });
    builder.addCase(toggleVendorStatus.fulfilled, (state, action) => {
      state.toggling = null;
      const v = state.list.find(v => v._id === action.payload.id);
      if (v) v.status = action.payload.status;
    });
    builder.addCase(toggleVendorStatus.rejected,  state => { state.toggling = null; });

    // updateVendor
    builder.addCase(updateVendor.pending,   state => { state.updating = true;  state.error = null; });
    builder.addCase(updateVendor.fulfilled, (state, action) => {
      state.updating = false;
      const v = state.list.find(v => v._id === action.payload.id);
      if (v) {
        v.name           = action.payload.name;
        v.email          = action.payload.email;
        v.phone          = action.payload.phone;
        v.capacity       = action.payload.capacity;
        v.deliveryTiming = action.payload.deliveryTiming;
        v.foodType       = action.payload.foodType;
        if (action.payload.logo) v.logo = action.payload.logo;
      }
    });
    builder.addCase(updateVendor.rejected, (state, action) => {
      state.updating = false;
      state.error    = action.payload as string;
    });
  },
});

export const { resetVendorState, optimisticToggleVendor, revertToggleVendor } = vendorSlice.actions;
export default vendorSlice.reducer;