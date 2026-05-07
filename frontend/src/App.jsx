import React from 'react';
import {
    BrowserRouter as Router, Routes, Route,
    Navigate, useLocation
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeContextProvider } from './context/ThemeContext';

// ── Layouts ──────────────────────────────────────────────────────────────────
import DashboardLayout from './layouts/DashboardLayout';

// ── Auth pages ───────────────────────────────────────────────────────────────
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// ── Public pages ─────────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';
import DoctorProfilePage from './pages/Doctor/DoctorProfilePage';

// ── Dashboard (role-aware) ────────────────────────────────────────────────────
import DashboardPage from './pages/DashboardPage';
import PatientPortalDashboard from './pages/Patient/PatientPortalDashboard';

// ── Shared / common ───────────────────────────────────────────────────────────
import ProfilePage from './pages/Common/ProfilePage';
import SettingsPage from './pages/Common/SettingsPage';

// ── Appointments ──────────────────────────────────────────────────────────────
import AppointmentListPage from './pages/Appointment/AppointmentListPage';
import AppointmentDetailPage from './pages/Appointment/AppointmentDetailPage';
import BookingPage from './pages/Appointment/BookingPage';
import StatusDashboard from './pages/Appointment/StatusDashboard';

// ── Patients ──────────────────────────────────────────────────────────────────
import PatientListPage from './pages/Patient/PatientListPage';
import PatientEMRPage from './pages/Patient/PatientEMRPage';
import FindDoctorPage from './pages/Patient/FindDoctorPage';

// ── Doctors ───────────────────────────────────────────────────────────────────
import DoctorListPage from './pages/Doctor/DoctorListPage';
import PrescriptionsPage from './pages/Doctor/PrescriptionsPage';

// ── Video ─────────────────────────────────────────────────────────────────────
import VideoConsultationPage from './pages/VideoConsultation/VideoConsultationPage';
import VideoConsultationsList from './pages/VideoConsultation/VideoConsultationsList';
import VideoStatusDashboard from './pages/VideoConsultation/VideoStatusDashboard';

// ── Billing ───────────────────────────────────────────────────────────────────
import BillingPage from './pages/BillingPage';
import AdminBillingPage from './pages/Admin/AdminBillingPage';

// ── Admin ─────────────────────────────────────────────────────────────────────
import UserManagementPage from './pages/Admin/UserManagementPage';
import ReceptionistListPage from './pages/Admin/ReceptionistListPage';
import ReportsPage from './pages/Admin/ReportsPage';
import AuditLogPage from './pages/Admin/AuditLogPage';
import BroadcastPage from './pages/Admin/BroadcastPage';
import InventoryListPage from './pages/Inventory/InventoryListPage';
import HospitalListPage from './pages/Hospital/HospitalListPage';

// ── Guards ────────────────────────────────────────────────────────────────────
import RoleGuard from './components/common/RoleGuard';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — redirects to /login if not authenticated
// ─────────────────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();
    if (!user) {
        const redirect = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirect}`} replace />;
    }
    return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardRouter — sends each role to the right dashboard component
// ─────────────────────────────────────────────────────────────────────────────
function DashboardRouter() {
    const { user } = useSelector((state) => state.auth);
    if (user?.role === 'Patient') return <PatientPortalDashboard />;
    return <DashboardPage />;
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoConsultationsRouter — role-aware video page
// ─────────────────────────────────────────────────────────────────────────────
function VideoConsultationsRouter() {
    const { user } = useSelector((state) => state.auth);
    if (user?.role === 'Patient') return <VideoConsultationsList />;
    return <VideoStatusDashboard />;
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <ThemeContextProvider>
            <Router>
                <Routes>
                    {/* ── Public ── */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Public doctor profile (no auth required to view) */}
                    <Route path="/doctor/:doctorId" element={<DoctorProfilePage />} />

                    {/* Video consultation — full-screen, outside DashboardLayout */}
                    <Route
                        path="/video/:roomId"
                        element={
                            <ProtectedRoute>
                                <VideoConsultationPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Protected dashboard routes ── */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard — role-aware */}
                        <Route path="/dashboard" element={<DashboardRouter />} />

                        {/* Common — all authenticated roles */}
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />

                        {/* Appointments — all roles see their own */}
                        <Route path="/appointments" element={<AppointmentListPage />} />
                        <Route path="/appointments/:id" element={<AppointmentDetailPage />} />

                        {/* Patients — Admin, Receptionist, Doctor */}
                        <Route
                            path="/patients"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist', 'Doctor', 'Patient']}>
                                    <PatientListPage />
                                </RoleGuard>
                            }
                        />

                        {/* EMR — Admin, Doctor, Patient */}
                        <Route
                            path="/emr"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Doctor', 'Patient', 'Receptionist']}>
                                    <PatientEMRPage />
                                </RoleGuard>
                            }
                        />

                        {/* Find Doctor — Patient */}
                        <Route path="/find-doctor" element={<FindDoctorPage />} />

                        {/* Book appointment — Patient */}
                        <Route path="/book/:doctorId" element={<BookingPage />} />

                        {/* Doctors list — Admin, Receptionist */}
                        <Route
                            path="/doctors"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist', 'Doctor', 'Patient']}>
                                    <DoctorListPage />
                                </RoleGuard>
                            }
                        />

                        {/* Prescriptions — Doctor */}
                        <Route
                            path="/prescriptions"
                            element={
                                <RoleGuard allowedRoles={['Doctor']}>
                                    <PrescriptionsPage />
                                </RoleGuard>
                            }
                        />

                        {/* Video consultations — all roles */}
                        <Route path="/video-consultations" element={<VideoConsultationsRouter />} />

                        {/* Billing — Patient, Receptionist */}
                        <Route
                            path="/billing"
                            element={
                                <RoleGuard allowedRoles={['Patient', 'Receptionist', 'Admin']}>
                                    <BillingPage />
                                </RoleGuard>
                            }
                        />

                        {/* Admin billing — Admin, Receptionist */}
                        <Route
                            path="/admin-billing"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist']}>
                                    <AdminBillingPage />
                                </RoleGuard>
                            }
                        />

                        {/* Inventory — Admin, Receptionist */}
                        <Route
                            path="/inventory"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist']}>
                                    <InventoryListPage />
                                </RoleGuard>
                            }
                        />

                        {/* Hospitals — Admin, Receptionist */}
                        <Route
                            path="/hospitals"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist']}>
                                    <HospitalListPage />
                                </RoleGuard>
                            }
                        />

                        {/* Reports — Admin */}
                        <Route
                            path="/reports"
                            element={
                                <RoleGuard allowedRoles={['Admin']}>
                                    <ReportsPage />
                                </RoleGuard>
                            }
                        />

                        {/* User management — Admin */}
                        <Route
                            path="/user-management"
                            element={
                                <RoleGuard allowedRoles={['Admin']}>
                                    <UserManagementPage />
                                </RoleGuard>
                            }
                        />

                        {/* Receptionists — Admin */}
                        <Route
                            path="/receptionists"
                            element={
                                <RoleGuard allowedRoles={['Admin']}>
                                    <ReceptionistListPage />
                                </RoleGuard>
                            }
                        />

                        {/* Audit log — Admin */}
                        <Route
                            path="/audit-log"
                            element={
                                <RoleGuard allowedRoles={['Admin']}>
                                    <AuditLogPage />
                                </RoleGuard>
                            }
                        />

                        {/* Broadcast — Admin */}
                        <Route
                            path="/broadcast"
                            element={
                                <RoleGuard allowedRoles={['Admin']}>
                                    <BroadcastPage />
                                </RoleGuard>
                            }
                        />

                        {/* Status dashboard — Admin, Receptionist, Doctor */}
                        <Route
                            path="/status-dashboard"
                            element={
                                <RoleGuard allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                                    <StatusDashboard />
                                </RoleGuard>
                            }
                        />
                    </Route>

                    {/* Fallback — unknown paths go to landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ThemeContextProvider>
    );
}
