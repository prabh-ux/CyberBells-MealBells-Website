// slices/superAdmin/superAdminUsersSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../app/axiosInstance";

export interface SuperUserRecord {
  _id:              string;
  name:             string;
  email:            string;
  phone?:           string;
  gender?:          string;
  department?:      string;
  role:             string;
  active:           boolean;
  avatar?:          string;
  organizationId?:  string[];
  organizationName: string;
  createdAt?:       string;
}

export interface NewSuperUserCredentials {
  name:     string;
  email:    string;
  password: string;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchSuperUsers = createAsyncThunk(
  "superUsers/fetchAll",
  async (orgId: string = "all", { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/super-admin/users", {
        params: { orgId },
      });
      return data.users as SuperUserRecord[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to fetch users.");
    }
  }
);

export const addSuperUser = createAsyncThunk(
  "superUsers/add",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/super-admin/users/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as { user: SuperUserRecord; tempPassword: string };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to add user.");
    }
  }
);

export const updateSuperUser = createAsyncThunk(
  "superUsers/update",
  async ({ id, payload }: { id: string; payload: FormData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/super-admin/users/${id}/update`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.user as SuperUserRecord;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to update user.");
    }
  }
);

export const toggleSuperUserStatus = createAsyncThunk(
  "superUsers/toggle",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/super-admin/users/${id}/status`);
      return { id, active: data.user.active as boolean };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to toggle status.");
    }
  }
);

export const deleteSuperUser = createAsyncThunk(
  "superUsers/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/super-admin/users/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Failed to delete user.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const superAdminUsersSlice = createSlice({
  name: "superUsers",
  initialState: {
    users:              [] as SuperUserRecord[],
    loading:            false,
    adding:             false,
    updating:           false,
    deleting:           false,
    toggling:           null as string | null,
    error:              null as string | null,
    newUserCredentials: null as NewSuperUserCredentials | null,
  },
  reducers: {
    clearNewUserCredentials(state) {
      state.newUserCredentials = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {

    // fetchSuperUsers
    builder
      .addCase(fetchSuperUsers.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchSuperUsers.fulfilled, (s, { payload }) => { s.loading = false; s.users = payload; })
      .addCase(fetchSuperUsers.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; });

    // addSuperUser
    builder
      .addCase(addSuperUser.pending,   s => { s.adding = true;  s.error = null; })
      .addCase(addSuperUser.fulfilled, (s, { payload }) => {
        s.adding = false;
        s.users.unshift(payload.user);
        s.newUserCredentials = {
          name:     payload.user.name,
          email:    payload.user.email,
          password: payload.tempPassword,
        };
      })
      .addCase(addSuperUser.rejected, (s, { payload }) => {
        s.adding = false;
        s.error  = payload as string;
      });

    // updateSuperUser
    builder
      .addCase(updateSuperUser.pending,   s => { s.updating = true;  s.error = null; })
      .addCase(updateSuperUser.fulfilled, (s, { payload }) => {
        s.updating = false;
        const idx  = s.users.findIndex(u => u._id === payload._id);
        if (idx !== -1) s.users[idx] = payload;
      })
      .addCase(updateSuperUser.rejected, (s, { payload }) => {
        s.updating = false;
        s.error    = payload as string;
      });

    // toggleSuperUserStatus
    builder
      .addCase(toggleSuperUserStatus.pending,   (s, { meta }) => { s.toggling = meta.arg; })
      .addCase(toggleSuperUserStatus.fulfilled, (s, { payload }) => {
        s.toggling = null;
        const u    = s.users.find(u => u._id === payload.id);
        if (u) u.active = payload.active;
      })
      .addCase(toggleSuperUserStatus.rejected, s => { s.toggling = null; });

    // deleteSuperUser
    builder
      .addCase(deleteSuperUser.pending,   s => { s.deleting = true; })
      .addCase(deleteSuperUser.fulfilled, (s, { payload }) => {
        s.deleting = false;
        s.users    = s.users.filter(u => u._id !== payload);
      })
      .addCase(deleteSuperUser.rejected, (s, { payload }) => {
        s.deleting = false;
        s.error    = payload as string;
      });
  },
});

export const { clearNewUserCredentials, clearError } = superAdminUsersSlice.actions;
export default superAdminUsersSlice.reducer;