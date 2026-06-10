import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

export interface AuthUser {
  _id:         string;
  name:        string;
  email:       string;
  phone?:      string;
  avatar?:     string;
  type:        string;
  role?:       string;
  department?: string;
}

export interface SignupPayload {
  name:     string;
  email:    string;
  password: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (payload: SignupPayload, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/signup", payload);
      const { data } = await axiosInstance.get("/auth/me");
      return {
        user:    data.user as AuthUser,
        message: "Account created successfully! Redirecting..." as string,
      };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.msg ??
        err.message ??
        "Signup failed. Please try again.";
      return rejectWithValue(typeof msg === "string" ? msg : "Signup failed.");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/login", payload);
      const { data } = await axiosInstance.get("/auth/me");
      return {
        user:    data.user as AuthUser,
        message: "Login successful! Redirecting..." as string,
      };
    } catch (err: any) {
      const msg =
        err.response?.data?.msg ??
        err.response?.data?.message ??
        err.message ??
        "Invalid credentials. Please try again.";
      return rejectWithValue(typeof msg === "string" ? msg : "Login failed.");
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/auth/me");
      return data.user as AuthUser;
    } catch (err: any) {
      return rejectWithValue(null);
    }
  }
);

export const updateMe = createAsyncThunk(
  "auth/updateMe",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put("/auth/me/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.user as AuthUser;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.msg ?? "Update failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await axiosInstance.post("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:          null as AuthUser | null,
    loading:       false,
    initialized:   false,
    saving:        false,
    signingUp:     false,
    loggingIn:     false,
    loginSuccess:  null as string | null,
    signupSuccess: null as string | null,
    error:         null as string | null,
  },
  reducers: {
    resetSignup(state) {
      state.signingUp     = false;
      state.signupSuccess = null;
      state.error         = null;
    },
    resetLogin(state) {
      state.loggingIn    = false;
      state.loginSuccess = null;
      state.error        = null;
    },
  },
  extraReducers: builder => {

    // ── signupUser ────────────────────────────────────────────────────────────
    builder.addCase(signupUser.pending, state => {
      state.signingUp     = true;
      state.signupSuccess = null;
      state.error         = null;
    });
    builder.addCase(signupUser.fulfilled, (state, action) => {
      state.signingUp     = false;
      state.initialized   = true;
      state.user          = action.payload.user;
      state.signupSuccess = action.payload.message;
    });
    builder.addCase(signupUser.rejected, (state, action) => {
      state.signingUp = false;
      state.error     = action.payload as string;
    });

    // ── loginUser ─────────────────────────────────────────────────────────────
    builder.addCase(loginUser.pending, state => {
      state.loggingIn    = true;
      state.loginSuccess = null;
      state.error        = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loggingIn    = false;
      state.initialized  = true;
      state.user         = action.payload.user;
      state.loginSuccess = action.payload.message;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loggingIn = false;
      state.error     = action.payload as string;
    });

    // ── fetchMe ───────────────────────────────────────────────────────────────
    builder.addCase(fetchMe.pending, state => {
      state.loading = true;
      state.error   = null;
    });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.loading     = false;
      state.initialized = true;
      state.user        = action.payload;
    });
    builder.addCase(fetchMe.rejected, state => {
      state.loading     = false;
      state.initialized = true;
      state.user        = null;
    });

    // ── updateMe ──────────────────────────────────────────────────────────────
    builder.addCase(updateMe.pending, state => {
      state.saving = true;
      state.error  = null;
    });
    builder.addCase(updateMe.fulfilled, (state, action) => {
      state.saving = false;
      state.user   = action.payload;
    });
    builder.addCase(updateMe.rejected, (state, action) => {
      state.saving = false;
      state.error  = action.payload as string;
    });

    // ── logoutUser ────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, state => {
      state.user        = null;
      state.initialized = true;
    });
  },
});

export const { resetSignup, resetLogin } = authSlice.actions;
export default authSlice.reducer;