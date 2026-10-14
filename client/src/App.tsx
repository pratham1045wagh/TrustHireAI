import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { SecurityPage } from './pages/SecurityPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResumesPage } from './pages/ResumesPage';
import { LoadingState } from './components/common/LoadingState';
import { ScrollToTop } from './components/common/ScrollToTop';

// Recruiter Pages (V1.0 + V2.0 / V2.5)
import { CreateJobPage } from './pages/recruiter/CreateJobPage';
import { JobsListPage } from './pages/recruiter/JobsListPage';
import { ApplicantsPage } from './pages/recruiter/ApplicantsPage';
import { StarredCandidatesPage } from './pages/recruiter/StarredCandidatesPage';
import { CandidateProfilePage } from './pages/recruiter/CandidateProfilePage';
import { AssessmentRoomsPage } from './pages/recruiter/AssessmentRoomsPage';
import { AssessmentRoomDetailsPage } from './pages/recruiter/AssessmentRoomDetailsPage';
import { SemanticSearchPage } from './pages/recruiter/SemanticSearchPage';
import { VerificationReportsDirectoryPage } from './pages/recruiter/VerificationReportsDirectoryPage';

// Candidate Pages (V1.0 + V2.0 / V2.5)
import { BrowseJobsPage } from './pages/candidate/BrowseJobsPage';
import { JobDetailsPage } from './pages/candidate/JobDetailsPage';
import { MyApplicationsPage } from './pages/candidate/MyApplicationsPage';
import { ApplicationDetailsPage } from './pages/candidate/ApplicationDetailsPage';
import { SkillVerificationPage } from './pages/candidate/SkillVerificationPage';
import { AssessmentsHubPage } from './pages/candidate/AssessmentsHubPage';
import { ProctoredAssessmentPage } from './pages/candidate/ProctoredAssessmentPage';
import { AssessmentReportPage } from './pages/candidate/AssessmentReportPage';
import { ProctoringReportPage } from './pages/candidate/ProctoringReportPage';
import { VerificationReportPage } from './pages/candidate/VerificationReportPage';

// Admin Pages (V2.5)
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminJobsPage } from './pages/admin/AdminJobsPage';
import { AdminResumesPage } from './pages/admin/AdminResumesPage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AdminProctoringPage } from './pages/admin/AdminProctoringPage';
import { AdminVectorDbPage } from './pages/admin/AdminVectorDbPage';
import { AdminAiUsagePage } from './pages/admin/AdminAiUsagePage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: UserRole | UserRole[];
}> = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    const userRole = String(user.role || '').trim().toUpperCase();
    const roles = (Array.isArray(allowedRole) ? allowedRole : [allowedRole]).map((r) =>
      String(r).trim().toUpperCase()
    );
    if (!roles.includes(userRole) && userRole !== 'ADMIN') {
      if (userRole === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (userRole === 'RECRUITER') {
        return <Navigate to="/recruiter/jobs" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Checking session..." />
      </div>
    );
  }

  if (user) {
    const userRole = String(user.role || '').trim().toUpperCase();
    if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (userRole === 'RECRUITER') {
      return <Navigate to="/recruiter/jobs" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Landing & Informational Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/resources" element={<ResourcesPage />} />

          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Shared Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Candidate Routes */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <ResumesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <ResumesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis/:resumeId"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/:resumeId"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/:resumeId/trustscore"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <VerificationReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/verification"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <VerificationReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/verification-report"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <VerificationReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/:resumeId/skill-evidence"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <SkillVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/skill-verification"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <SkillVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/:resumeId/assessment"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AssessmentsHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/assessments"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AssessmentsHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/invitations"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AssessmentsHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/assessment/:sessionId"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <ProctoredAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/assessment/:sessionId/report"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <AssessmentReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/assessment/:sessionId/proctoring"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <ProctoringReportPage />
                </ProtectedRoute>
              }
            />
            <Route path="/jobs" element={<BrowseJobsPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
            <Route
              path="/my-applications"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <MyApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-applications/:applicationId"
              element={
                <ProtectedRoute allowedRole="CANDIDATE">
                  <ApplicationDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Recruiter Routes */}
            <Route
              path="/recruiter/jobs"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <JobsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/create"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <CreateJobPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:jobId"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <JobDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applicants"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <ApplicantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/starred"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <StarredCandidatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidates"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <SemanticSearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/candidates/:candidateId"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <CandidateProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/assessment-rooms"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <AssessmentRoomsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/assessment-rooms/:id"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <AssessmentRoomDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/reports"
              element={
                <ProtectedRoute allowedRole="RECRUITER">
                  <VerificationReportsDirectoryPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resumes"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminResumesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assessments"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminAssessmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/proctoring"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminProctoringPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vector-db"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminVectorDbPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-usage"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminAiUsagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
