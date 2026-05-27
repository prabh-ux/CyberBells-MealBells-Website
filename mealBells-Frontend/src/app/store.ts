import { configureStore } from "@reduxjs/toolkit";
import dishReducer   from "../slices/dishSlice";
import vendorReducer from "../slices/vendorSlice";
import authReducer from "../slices/authSlice";
import organizationReducer from "../slices/organizationSlice";
import userReducer from "../slices/userSlice";

export const store = configureStore({
  reducer: {
    dishes:  dishReducer,
    vendors: vendorReducer,
    auth: authReducer,
   organization: organizationReducer,
   users: userReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;