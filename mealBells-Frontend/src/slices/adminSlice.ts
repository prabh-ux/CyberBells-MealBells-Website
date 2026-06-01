import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";
import { AVATARS } from "../data/UserManagement";
import type { User, EditForm, EditVendorForm, Vendor } from "../types/admin";

export interface UserRecord {
  _id:         string;
  fullName:    string;
  email:       string;
  phone?:      string;
  gender?:     string;
  department?: string;
  role:        string;
  active:      boolean;
  avatar?:     string;
}

export interface NewVendorCredentials {
  email:    string;
  password: string;
  name:     string;
}

// ── User Thunks ───────────────────────────────────────────────────────────────

export const addUser = createAsyncThunk(
  "admin/addUser",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/users/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.user as UserRecord;
    } catch (err: any) {
      const msg =
        err.response?.data?.msg ??
        err.response?.data?.message ??
        err.message ??
        "Something went wrong";
      return rejectWithValue(typeof msg === "string" ? msg : "Failed to add user.");
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "admin/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/users");
      const mapped: User[] = data.users.map((u: any, i: number) => {
        const isActive =
          u.active === true ||
          u.active === "true" ||
          u.active === 1 ||
          u.status === "Active";
        return {
          id:         u._id,
          name:       u.name       ?? "Unknown",
          email:      u.email      ?? "",
          phone:      u.phone      ?? "",
          department: (u.department ?? "ENGINEERING").toUpperCase(),
          status:     isActive ? "Active" : "Inactive",
          avatar:     u.avatar ?? AVATARS[i % AVATARS.length],
        };
      });
      return mapped;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.msg ?? "Failed to fetch users. Please try again."
      );
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  "admin/toggleStatus",
  async ({ id, currentStatus }: { id: string; currentStatus: string }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/user/${id}/status`, {
        active: currentStatus === "Active",
      });
      return {
        id,
        status: data.user.active ? "Active" : "Inactive",
        msg:    data.msg ?? "Status updated successfully!",
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update status.");
    }
  }
);

export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, form, file }: { id: string; form: EditForm; file?: File }, { rejectWithValue }) => {
    try {
      const payload = new FormData();
      payload.append("fullName",   form.name);
      payload.append("email",      form.email);
      payload.append("phone",      form.phone);
      payload.append("department", form.department);
      if (file) payload.append("avatar", file);

      const { data } = await axiosInstance.put(`/admin/user/${id}/update`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        id,
        name:       data.user.name,
        email:      data.user.email,
        phone:      data.user.phone       ?? "",
        department: (data.user.department ?? "").toUpperCase(),
        avatar:     data.user.avatar,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update user.");
    }
  }
);

// ── Vendor-Admin Thunks (moved from vendorSlice) ──────────────────────────────

export const fetchVendors = createAsyncThunk(
  "admin/fetchVendors",
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
  "admin/addVendor",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/vendors/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        vendor:       data.vendor      as Vendor,
        tempPassword: data.tempPassword as string,
      };
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
  "admin/toggleVendorStatus",
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
  "admin/updateVendor",
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

// ── Slice ─────────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    // Users
    users:    [] as User[],
    loading:  false,
    adding:   false,
    updating: false,
    toggling: null as string | null,
    error:    null as string | null,

    // Vendors
    vendors:              [] as Vendor[],
    vendorsLoading:       false,
    vendorAdding:         false,
    vendorUpdating:       false,
    vendorToggling:       null as string | null,
    newVendorCredentials: null as NewVendorCredentials | null,
    vendorError:          null as string | null,
  },
  reducers: {
    resetUserState(state) {
      state.adding = false;
      state.error  = null;
    },
    resetVendorState(state) {
      state.vendorAdding = false;
      state.vendorError  = null;
    },
    clearNewVendorCredentials(state) {
      state.newVendorCredentials = null;
    },
    optimisticToggle(state, action: { payload: string }) {
      const u = state.users.find(u => u.id === action.payload);
      if (u) u.status = u.status === "Active" ? "Inactive" : "Active";
    },
    revertToggle(state, action: { payload: { id: string; status: string } }) {
      const u = state.users.find(u => u.id === action.payload.id);
      if (u) u.status = action.payload.status as "Active" | "Inactive";
    },
    optimisticToggleVendor(state, action: { payload: string }) {
      const v = state.vendors.find(v => v._id === action.payload);
      if (v) v.status = !v.status;
    },
    revertToggleVendor(state, action: { payload: { id: string; status: boolean } }) {
      const v = state.vendors.find(v => v._id === action.payload.id);
      if (v) v.status = action.payload.status;
    },
    importCSVUsers(state, action: { payload: User[] }) {
      state.users.push(...action.payload);
    },
  },
  extraReducers: builder => {

    // addUser
    builder.addCase(addUser.pending,   state => { state.adding = true;  state.error = null; });
    builder.addCase(addUser.fulfilled, state => { state.adding = false; });
    builder.addCase(addUser.rejected,  (state, { payload }) => { state.adding = false; state.error = payload as string; });

    // fetchUsers
    builder.addCase(fetchUsers.pending,   state => { state.loading = true;  state.error = null; });
    builder.addCase(fetchUsers.fulfilled, (state, { payload }) => { state.loading = false; state.users = payload; });
    builder.addCase(fetchUsers.rejected,  (state, { payload }) => { state.loading = false; state.error = payload as string; });

    // toggleUserStatus
    builder.addCase(toggleUserStatus.pending,   (state, { meta }) => { state.toggling = meta.arg.id; });
    builder.addCase(toggleUserStatus.fulfilled, (state, { payload }) => {
      state.toggling = null;
      const u = state.users.find(u => u.id === payload.id);
      if (u) u.status = payload.status as "Active" | "Inactive";
    });
    builder.addCase(toggleUserStatus.rejected, state => { state.toggling = null; });

    // updateUser
    builder.addCase(updateUser.pending,   state => { state.updating = true;  state.error = null; });
    builder.addCase(updateUser.fulfilled, (state, { payload }) => {
      state.updating = false;
      const u = state.users.find(u => u.id === payload.id);
      if (u) {
        u.name       = payload.name;
        u.email      = payload.email;
        u.phone      = payload.phone;
        u.department = payload.department;
        if (payload.avatar) u.avatar = payload.avatar;
      }
    });
    builder.addCase(updateUser.rejected, (state, { payload }) => {
      state.updating = false;
      state.error    = payload as string;
    });

    // fetchVendors
    builder.addCase(fetchVendors.pending,   state => { state.vendorsLoading = true;  state.vendorError = null; });
    builder.addCase(fetchVendors.fulfilled, (state, { payload }) => { state.vendorsLoading = false; state.vendors = payload; });
    builder.addCase(fetchVendors.rejected,  (state, { payload }) => { state.vendorsLoading = false; state.vendorError = payload as string; });

    // addVendor
    builder.addCase(addVendor.pending,   state => { state.vendorAdding = true;  state.vendorError = null; });
    builder.addCase(addVendor.fulfilled, (state, { payload }) => {
      state.vendorAdding = false;
      state.vendors.unshift(payload.vendor);
      state.newVendorCredentials = {
        email:    payload.vendor.email,
        name:     payload.vendor.name,
        password: payload.tempPassword,
      };
    });
    builder.addCase(addVendor.rejected, (state, { payload }) => {
      state.vendorAdding = false;
      state.vendorError  = payload as string;
    });

    // toggleVendorStatus
    builder.addCase(toggleVendorStatus.pending,   (state, { meta }) => { state.vendorToggling = meta.arg.id; });
    builder.addCase(toggleVendorStatus.fulfilled, (state, { payload }) => {
      state.vendorToggling = null;
      const v = state.vendors.find(v => v._id === payload.id);
      if (v) v.status = payload.status;
    });
    builder.addCase(toggleVendorStatus.rejected, state => { state.vendorToggling = null; });

    // updateVendor
    builder.addCase(updateVendor.pending,   state => { state.vendorUpdating = true;  state.vendorError = null; });
    builder.addCase(updateVendor.fulfilled, (state, { payload }) => {
      state.vendorUpdating = false;
      const v = state.vendors.find(v => v._id === payload.id);
      if (v) {
        v.name           = payload.name;
        v.email          = payload.email;
        v.phone          = payload.phone;
        v.capacity       = payload.capacity;
        v.deliveryTiming = payload.deliveryTiming;
        v.foodType       = payload.foodType;
        if (payload.logo) v.logo = payload.logo;
      }
    });
    builder.addCase(updateVendor.rejected, (state, { payload }) => {
      state.vendorUpdating = false;
      state.vendorError    = payload as string;
    });
  },
});

export const {
  resetUserState,
  resetVendorState,
  clearNewVendorCredentials,
  optimisticToggle,
  revertToggle,
  optimisticToggleVendor,
  revertToggleVendor,
  importCSVUsers,
} = adminSlice.actions;

export default adminSlice.reducer;