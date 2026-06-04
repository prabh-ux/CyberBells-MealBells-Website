import { configureStore } from "@reduxjs/toolkit";
import dishReducer              from "../slices/dishSlice";
import vendorReducer            from "../slices/vendorSlice";
import authReducer              from "../slices/authSlice";
import organizationReducer      from "../slices/organizationSlice";
import adminReducer             from "../slices/adminSlice";
import userReducer              from "../slices/userSlice";
import deliveryReducer          from "../slices/deliverySlice";
import analyticsReducer         from "../slices/adminAnalyticsSlice";
import vendorPerformanceReducer from "../slices/vendorPerformanceSlice";
import dishRequestReducer       from "../slices/Dishrequestslice";

export const store = configureStore({
  reducer: {
    dishes:            dishReducer,
    vendors:           vendorReducer,
    auth:              authReducer,
    organization:      organizationReducer,
    admin:             adminReducer,
    user:              userReducer,
    delivery:          deliveryReducer,
    analytics:         analyticsReducer,
    vendorPerformance: vendorPerformanceReducer,
    dishRequests:      dishRequestReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;