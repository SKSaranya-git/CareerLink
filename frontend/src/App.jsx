import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import PostJobPage from "./pages/PostJobPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardOverviewPage from "./pages/dashboard/DashboardOverviewPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import ApprovalsPage from "./pages/dashboard/ApprovalsPage";

function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:role" element={<RegisterPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="approvals"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <ApprovalsPage />
                </RoleRoute>
              }
            />
          </Route>
          <Route
            path="/post-job"
            element={
              <RoleRoute allowedRoles={["employer"]}>
                <PostJobPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <ApprovalsPage />
              </RoleRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
