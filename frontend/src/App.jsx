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
import MyApplicationsPage from "./pages/dashboard/MyApplicationsPage";
import EmployerMyJobsPage from "./pages/dashboard/EmployerMyJobsPage";
import EmployerJobApplicationsPage from "./pages/dashboard/EmployerJobApplicationsPage";
import EmployerShortlistedPage from "./pages/dashboard/EmployerShortlistedPage";
import ScheduleInterviewPage from "./pages/dashboard/ScheduleInterviewPage";
import SavedJobsPage from "./pages/dashboard/SavedJobsPage";
import MyInterviewsPage from "./pages/dashboard/MyInterviewsPage";
import AdminNotificationsPage from "./pages/dashboard/AdminNotificationsPage";

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
            <Route
              path="analytics"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <DashboardOverviewPage />
                </RoleRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="my-applications"
              element={
                <RoleRoute allowedRoles={["job_seeker"]}>
                  <MyApplicationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="saved-jobs"
              element={
                <RoleRoute allowedRoles={["job_seeker"]}>
                  <SavedJobsPage />
                </RoleRoute>
              }
            />
            <Route
              path="interviews"
              element={
                <RoleRoute allowedRoles={["job_seeker"]}>
                  <MyInterviewsPage />
                </RoleRoute>
              }
            />
            <Route
              path="my-jobs"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerMyJobsPage />
                </RoleRoute>
              }
            />
            <Route
              path="job/:jobId/applications"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerJobApplicationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="shortlisted"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerShortlistedPage />
                </RoleRoute>
              }
            />
            <Route
              path="schedule-interview/:applicationId"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <ScheduleInterviewPage />
                </RoleRoute>
              }
            />
            <Route
              path="approvals"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <ApprovalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminNotificationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="post-job"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <PostJobPage />
                </RoleRoute>
              }
            />
          </Route>
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
