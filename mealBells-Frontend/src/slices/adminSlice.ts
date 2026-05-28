import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";
import { AVATARS } from "../data/UserManagement";
import type { User, EditForm } from "../types/admin";

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

// ── Thunks ───────────────────────────────────────────────────────────────────

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

// ── Slice ─────────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users:    [] as User[],
    loading:  false,
    adding:   false,
    updating: false,
    toggling: null as string | null,
    error:    null as string | null,
  },
  reducers: {
    resetUserState(state) {
      state.adding  = false;
      state.error   = null;
    },
    // optimistic toggle — call before dispatching toggleUserStatus
    optimisticToggle(state, action: { payload: string }) {
      const u = state.users.find(u => u.id === action.payload);
      if (u) u.status = u.status === "Active" ? "Inactive" : "Active";
    },
    // revert optimistic toggle on failure
    revertToggle(state, action: { payload: { id: string; status: string } }) {
      const u = state.users.find(u => u.id === action.payload.id);
      if (u) u.status = action.payload.status as "Active" | "Inactive";
    },
    importCSVUsers(state, action: { payload: User[] }) {
      state.users.push(...action.payload);
    },
  },
  extraReducers: builder => {
    // addUser
    builder.addCase(addUser.pending,    state => { state.adding = true;  state.error = null; });
    builder.addCase(addUser.fulfilled,  state => { state.adding = false; });
    builder.addCase(addUser.rejected,   (state, action) => { state.adding = false; state.error = action.payload as string; });

    // fetchUsers
    builder.addCase(fetchUsers.pending,    state => { state.loading = true;  state.error = null; });
    builder.addCase(fetchUsers.fulfilled,  (state, action) => { state.loading = false; state.users = action.payload; });
    builder.addCase(fetchUsers.rejected,   (state, action) => { state.loading = false; state.error = action.payload as string; });

    // toggleUserStatus
    builder.addCase(toggleUserStatus.pending,   (state, action) => { state.toggling = action.meta.arg.id; });
    builder.addCase(toggleUserStatus.fulfilled, (state, action) => {
      state.toggling = null;
      const u = state.users.find(u => u.id === action.payload.id);
      if (u) u.status = action.payload.status as "Active" | "Inactive";
    });
    builder.addCase(toggleUserStatus.rejected,  state => { state.toggling = null; });

    // updateUser
    builder.addCase(updateUser.pending,    state => { state.updating = true;  state.error = null; });
    builder.addCase(updateUser.fulfilled,  (state, action) => {
      state.updating = false;
      const u = state.users.find(u => u.id === action.payload.id);
      if (u) {
        u.name       = action.payload.name;
        u.email      = action.payload.email;
        u.phone      = action.payload.phone;
        u.department = action.payload.department;
        if (action.payload.avatar) u.avatar = action.payload.avatar;
      }
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.updating = false;
      state.error    = action.payload as string;
    });
  },
});

export const { resetUserState, optimisticToggle, revertToggle, importCSVUsers } = adminSlice.actions;
export default adminSlice.reducer;