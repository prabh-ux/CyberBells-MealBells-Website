import { configureStore } from "@reduxjs/toolkit";
import dishReducer                    from "../slices/dishSlice";
import vendorReducer                  from "../slices/vendorSlice";
import authReducer                    from "../slices/authSlice";
import organizationReducer            from "../slices/organizationSlice";
import adminReducer                   from "../slices/adminSlice";
import userReducer                    from "../slices/userSlice";
import deliveryReducer                from "../slices/deliverySlice";
import analyticsReducer               from "../slices/adminAnalyticsSlice";
import vendorPerformanceReducer       from "../slices/vendorPerformanceSlice";
import dishRequestReducer             from "../slices/dishRequestSlice";
import consumptionReducer             from "../slices/ConsumptionSliceAdmin";
import foodWastageReducer             from "../slices/Foodwastageslice";
import superAnalyticsReducer          from "../slices/superAdmin/superAdminAnalyticsSlice";
import superUsersReducer              from "../slices/superAdmin/superAdminUsersSlice";
import superDishRequestReducer        from "../slices/superAdmin/superDishRequestSlice";
import superVendorsReducer            from "../slices/superAdmin/superAdminVendorSlice";
import superVendorPerformanceReducer  from "../slices/superAdmin/superAdminVendorPerformanceSlice";

export const store = configureStore({
  reducer: {
    dishes:                  dishReducer,
    vendors:                 vendorReducer,
    auth:                    authReducer,
    organization:            organizationReducer,
    admin:                   adminReducer,
    user:                    userReducer,
    delivery:                deliveryReducer,
    analytics:               analyticsReducer,
    vendorPerformance:       vendorPerformanceReducer,
    dishRequests:            dishRequestReducer,
    consumption:             consumptionReducer,
    foodWastage:             foodWastageReducer,
    superAnalytics:          superAnalyticsReducer,
    superUsers:              superUsersReducer,
    superDishRequests:       superDishRequestReducer,
    superVendors:            superVendorsReducer,
    superVendorPerformance:  superVendorPerformanceReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;