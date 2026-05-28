import { configureStore } from "@reduxjs/toolkit";
import dishReducer   from "../slices/dishSlice";
import vendorReducer from "../slices/vendorSlice";
import authReducer from "../slices/authSlice";
import organizationReducer from "../slices/organizationSlice";
import adminReducer from "../slices/adminSlice";

export const store = configureStore({
  reducer: {
    dishes:  dishReducer,
    vendors: vendorReducer,
    auth: authReducer,
   organization: organizationReducer,
   admin: adminReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;