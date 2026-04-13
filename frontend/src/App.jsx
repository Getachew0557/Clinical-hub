import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Auth pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard
import DashboardPage from './pages/DashboardPage';
import DoctorListPage from './pages/Doctor/DoctorListPage';
import DoctorProfilePage from './pages/Doctor/DoctorProfilePage';
import AppointmentListPage from './pages/Appointment/AppointmentListPage';
import PatientListPage from './pages/Patient/PatientListPage';
import InventoryListPage from './pages/Inventory/InventoryListPage';
import BillingPage from './pages/BillingPage';

// New Pages
import PatientEMRPage from './pages/Patient/PatientEMRPage';
import ReportsPage from './pages/Admin/ReportsPage';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/Appointment/BookingPage';
import ProfilePage from './pages/Common/ProfilePage';
import SettingsPage from './pages/Common/SettingsPage';
import PatientPortalDashboard from './pages/Patient/PatientPortalDashboard';
import ReceptionistListPage from './pages/Admin/ReceptionistListPage';
import RoleGuard from './components/common/RoleGuard';
import VideoConsultationPage from './pages/VideoConsultation/VideoConsultationPage';
import VideoConsultationsList from './pages/VideoConsultation/VideoConsultationsList';

// ── MUI Theme ────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: '#0d9488', light: '#ccfbf1', dark: '#0f766e' },
    secondary: { main: '#64748b' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", "sans-serif"',
    // Page titles
    h4: { fontWeight: 800, fontSize: '1.75rem' },
    h5: { fontWeight: 800, fontSize: '1.5rem' },  // Main page title — 24px
    h6: { fontWeight: 700, fontSize: '1.125rem' }, // Sub-section title — 18px
    // Card/section headings
    subtitle1: { fontWeight: 700, fontSize: '1rem' },   // 16px section head
    subtitle2: { fontWeight: 600, fontSize: '0.875rem' }, // 14px sub-head
    // Body text
    body1: { fontWeight: 400, fontSize: '0.875rem' },  // 14px body
    body2: { fontWeight: 400, fontSize: '0.875rem' },  // 14px body
    // Labels, hints, metadata
    caption: { fontWeight: 400, fontSize: '0.75rem' }, // 12px caption
    overline: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }, // 10px badge
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#cbd5e1' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 24 },
      },
    },
  },
});

// ── Protected Route ──────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
};

// ── Role-based Dashboard Router ──────────────────────────
const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'Patient') {
    return <PatientPortalDashboard />;
  }
  return <DashboardPage />;
};

// ── App ──────────────────────────────────────────────────
const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Public Doctor Profile (no auth required to view) ── */}
        <Route path="/doctor/:doctorId" element={<DoctorProfilePage />} />

        {/* ── Video Consultation (full-screen, outside DashboardLayout) ── */}
        <Route
          path="/video/:roomId"
          element={
            <ProtectedRoute>
              <VideoConsultationPage />
            </ProtectedRoute>
          }
        />

        {/* ── Public auth routes ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* ── Protected dashboard routes ── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/doctors" element={<RoleGuard allowedRoles={['Admin','Doctor','Receptionist']}><DoctorListPage /></RoleGuard>} />
          <Route path="/appointments" element={<AppointmentListPage />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/emr" element={<RoleGuard allowedRoles={['Admin','Doctor','Patient']}><PatientEMRPage /></RoleGuard>} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/inventory" element={<RoleGuard allowedRoles={['Admin','Receptionist']}><InventoryListPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={['Admin']}><ReportsPage /></RoleGuard>} />
          <Route path="/receptionists" element={<RoleGuard allowedRoles={['Admin']}><ReceptionistListPage /></RoleGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/book/:doctorId" element={<BookingPage />} />
          <Route path="/video-consultations" element={<RoleGuard allowedRoles={['Doctor']}><VideoConsultationsList /></RoleGuard>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </ThemeProvider>
);

// Temporary placeholder while we build out each module
function PlaceholderPage({ title }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
        <span className="text-3xl">🚧</span>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-slate-600">{title}</p>
        <p className="text-sm">This module is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
