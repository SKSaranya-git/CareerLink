import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
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
import ProfilePublicPage from "./pages/dashboard/ProfilePublicPage";
import ApprovalsPage from "./pages/dashboard/ApprovalsPage";
import MyApplicationsPage from "./pages/dashboard/MyApplicationsPage";
import EmployerMyJobsPage from "./pages/dashboard/EmployerMyJobsPage";
import EmployerInterviewPage from "./pages/dashboard/EmployerInterviewPage";
import EmployerAnalyticsPage from "./pages/dashboard/EmployerAnalyticsPage";
import EmployerJobApplicationsPage from "./pages/dashboard/EmployerJobApplicationsPage";
import EmployerShortlistedPage from "./pages/dashboard/EmployerShortlistedPage";
import ApplicantSeekerProfilePage from "./pages/dashboard/ApplicantSeekerProfilePage";
import ScheduleInterviewPage from "./pages/dashboard/ScheduleInterviewPage";
import AdminAnalyticsNotificationsPage from "./pages/dashboard/AdminAnalyticsNotificationsPage";

function PublicJobsRoute() {
  const { user } = useAuth();
  if (user?.role === "job_seeker") {
    return <Navigate to="/dashboard/jobs" replace />;
  }
  return <JobsPage />;
}

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
          <Route path="/jobs" element={<PublicJobsRoute />} />
          <Route path="/employer/:employerId" element={<ProfilePublicPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="profile" element={<ProfilePublicPage />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route
              path="my-applications"
              element={
                <RoleRoute allowedRoles={["job_seeker"]}>
                  <MyApplicationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <RoleRoute allowedRoles={["job_seeker"]}>
                  <JobsPage />
                </RoleRoute>
              }
            />
            <Route path="employer/:employerId" element={<ProfilePublicPage />} />
            <Route
              path="my-jobs"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerMyJobsPage />
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
            <Route
              path="interviews"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerInterviewPage />
                </RoleRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <EmployerAnalyticsPage />
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
              path="applicant/:seekerId"
              element={
                <RoleRoute allowedRoles={["employer"]}>
                  <ApplicantSeekerProfilePage />
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
              path="analytics-notifications"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminAnalyticsNotificationsPage />
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
          </Route>
          <Route
            path="/post-job"
            element={
              <RoleRoute allowedRoles={["employer"]}>
                <Navigate to="/dashboard/post-job" replace />
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
