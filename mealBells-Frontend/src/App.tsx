import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import AdminHeader from "./components/shared/AdminHeader";
import AdminSidebar from "./components/shared/AdminSidebar";

import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import FoodWastageReport from "./pages/admin/FoodWastageReport";
import UserManagement from "./pages/admin/UserManagement";
import VendorPerformance from "./pages/admin/VendorPerformance";
import Landing from "./pages/Landing";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import Login from "./pages/auth/login";
import MenuOverview from "./pages/admin/MenuOverview";
import MenuManagement from "./pages/admin/MenuManagement";
import Settings from "./pages/admin/Settings";
import AddUser from "./pages/admin/AddUser";
import VendorManagement from "./pages/admin/VendorManagement";
import AddVendor from "./pages/admin/AddVendor";
import AttendanceSummary from "./pages/admin/AttendanceSummary";
import ConsumptionAnalytics from "./pages/admin/ConsumptionAnalytics";
import ProfileSettings from "./pages/admin/ProfileSettings";

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col h-screen">
      {isAdminRoute ? <AdminHeader /> : <Header />}

      <div className="flex flex-1 min-h-0">
        {isAdminRoute && <AdminSidebar />}

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/admin/profile" element={<ProfileSettings />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/add-user" element={<AddUser />} />
            <Route path="/admin/vendors" element={<VendorManagement />} />
            <Route path="/admin/add-vendor" element={<AddVendor />} />
            <Route path="/admin/vendors-performance" element={<VendorPerformance />} />
            <Route path="/admin/menu-overview" element={<MenuOverview />} />
            <Route path="/admin/menu-Management" element={<MenuManagement />} />
            <Route path="/admin/attendance" element={<AttendanceSummary />} />
            <Route path="/admin/reports" element={<FoodWastageReport />} />
            <Route path="/admin/food-wastage-report" element={<FoodWastageReport />} />
            <Route path="/admin/consumption-analytics-report" element={<ConsumptionAnalytics />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Routes>

          {!isAdminRoute && <Footer />}
        </main>
      </div>
    </div>
  );
}

export default App;