import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

import AdminHeader from "./components/shared/AdminHeader";
import AdminSidebar from "./components/shared/AdminSidebar";
import UserHeader from "./components/shared/UserHeader";
import UserSidebar from "./components/shared/UserSidebar";
import VendorHeader from "./components/shared/VendorHeader";
import VendorSidebar from "./components/shared/VendorSidebar";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import FoodWastageReport from "./pages/admin/FoodWastageReport";
import UserManagement from "./pages/admin/UserManagement";
import VendorPerformance from "./pages/admin/VendorPerformance";
import Landing from "./pages/Landing";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import MenuOverview from "./pages/admin/MenuOverview";
import MenuManagement from "./pages/admin/MenuManagement";
import Settings from "./pages/admin/Settings";
import AddUser from "./pages/admin/AddUser";
import VendorManagement from "./pages/admin/VendorManagement";
import AddVendor from "./pages/admin/AddVendor";
import AttendanceSummary from "./pages/admin/AttendanceSummary";
import ConsumptionAnalytics from "./pages/admin/ConsumptionAnalytics";
import ProfileSettings from "./pages/admin/ProfileSettings";
import Signup from "./pages/auth/Signup";
import TodayMenuPanel from "./pages/user/TodayMenuPanel";
import WeeklyMenuPanel from "./pages/user/Weeklymenupanel";
import DishDetailsPanel from "./pages/user/Dishdetailspanel";
import ProtectedRoute from "./utils/ProtectedRoute";
import RequestDishPanel from "./pages/user/Requestdishpanel";
import MyReviewsPanel from "./pages/user/Myreviewspanel";
import RateMealPanel from "./pages/user/Ratemealpanel";
import DeliveryStatus from "./pages/user/DeliveryStatus";
import MyConsumptionReport from "./pages/user/MyConsumptionReport";
import Profile from "./pages/user/Profile";
import Notifications from "./pages/user/Notifications";
import Login from "./pages/auth/Login";
import AdminNotifications from "./pages/admin/AdminNotifications";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import TodayMenu from "./pages/vendor/TodayMenu";
import EditDish from "./pages/vendor/EditDish";
import WeeklyMenu from "./pages/vendor/WeeklyMenu";
import RequestedDishes from "./pages/vendor/RequestedDishes";
import DeliveryStatusVendor from "./pages/vendor/DeliveryStatusVendor";
import VendorReviews from "./pages/vendor/VendorReviews";
import ReviewDetail from "./pages/vendor/ReviewDetail";



function App() {
  const location = useLocation();
  const isAdminRoute  = location.pathname.startsWith("/admin");
  const isUserRoute   = location.pathname.startsWith("/user");
  const isVendorRoute = location.pathname.startsWith("/vendor");

  return (
    <div className="flex flex-col h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
          },
        }}
      />

      {isAdminRoute ? (
        <AdminHeader />
      ) : isUserRoute ? (
        <UserHeader />
      ) : isVendorRoute ? (
        <VendorHeader />
      ) : (
        <Header />
      )}

      <div className="flex flex-1 min-h-0">
        {isAdminRoute  && <AdminSidebar />}
        {isUserRoute   && <UserSidebar />}
        {isVendorRoute && <VendorSidebar />}

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <Routes>
            {/* Public */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Landing />} />
            </Route>

            {/* Auth */}
            <Route element={<ProtectedRoute redirectIfAuthed />}>
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Admin — protected */}
            <Route element={<ProtectedRoute requireAuth />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard"                    element={<AnalyticsDashboard />} />
              <Route path="/admin/profile"                      element={<ProfileSettings />} />
              <Route path="/admin/users"                        element={<UserManagement />} />
              <Route path="/admin/add-user"                     element={<AddUser />} />
              <Route path="/admin/vendors"                      element={<VendorManagement />} />
              <Route path="/admin/add-vendor"                   element={<AddVendor />} />
              <Route path="/admin/vendors-performance"          element={<VendorPerformance />} />
              <Route path="/admin/menu-overview"                element={<MenuOverview />} />
              <Route path="/admin/menu-management"              element={<MenuManagement />} />
              <Route path="/admin/menu-management/:id"          element={<MenuManagement />} />
              <Route path="/admin/attendance"                   element={<AttendanceSummary />} />
              <Route path="/admin/reports"                      element={<FoodWastageReport />} />
              <Route path="/admin/food-wastage-report"          element={<FoodWastageReport />} />
              <Route path="/admin/consumption-analytics-report" element={<ConsumptionAnalytics />} />
              <Route path="/admin/settings"                     element={<Settings />} />
              <Route path="/admin/notifications"                element={<AdminNotifications />} />
            </Route>

            {/* User */}
            <Route path="/user" element={<Navigate to="/user/today-menu" replace />} />
            <Route path="/user/today-menu"            element={<TodayMenuPanel />} />
            <Route path="/user/weekly-menu-panel"     element={<WeeklyMenuPanel />} />
            <Route path="/user/dish-details-panel/:scheduleId" element={<DishDetailsPanel />} />
            <Route path="/user/dish-request"          element={<RequestDishPanel />} />
            <Route path="/user/reviews"               element={<MyReviewsPanel />} />
            <Route path="/user/rate-my-meal"          element={<RateMealPanel />} />
            <Route path="/user/delivery-status"       element={<DeliveryStatus />} />
            <Route path="/user/my-consumption-report" element={<MyConsumptionReport />} />
            <Route path="/user/profile"               element={<Profile />} />
            <Route path="/user/notification"          element={<Notifications />} />

            {/* Vendor — protected */}
            <Route element={<ProtectedRoute requireAuth />}>
              <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
               <Route path="/vendor/menu"     element={<TodayMenu />} /> 
             <Route path="/vendor/menu/edit" element={<EditDish />} />
             <Route path="/vendor/menu/weekly" element={<WeeklyMenu />} />
             <Route path="/vendor/requested-dishes" element={<RequestedDishes />} />
             <Route path="/vendor/delivery" element={<DeliveryStatusVendor />} /> 
              {<Route path="/vendor/reviews"  element={<VendorReviews />} /> }
              <Route path="/vendor/reviews/:id" element={<ReviewDetail />} />
              {/* <Route path="/vendor/reports"  element={<VendorReports />} /> */}
              {/* <Route path="/vendor/settings" element={<VendorSettings />} /> */}
            </Route>
          </Routes>

          {!isAdminRoute && !isUserRoute && !isVendorRoute && <Footer />}
        </main>
      </div>
    </div>
  );
}

export default App;