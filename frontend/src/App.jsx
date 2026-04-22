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
import StatusDashboard from './pages/Appointment/StatusDashboard';
import VideoStatusDashboard from './pages/VideoConsultation/VideoStatusDashboard';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// ── MUI Theme ────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: '#0d9488', light: '#ccfbf1', dark: '#0f766e' },
    secondary: { main: '#64748b' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Outfit", system-ui, -apple-system, sans-serif',
    htmlFontSize: 16,
    fontSize: 15,
    // ── Headings: bold, decreasing size ──
    h1: { fontWeight: 700, fontSize: '1.75rem',  lineHeight: 1.2  }, // 28px
    h2: { fontWeight: 700, fontSize: '1.5rem',   lineHeight: 1.25 }, // 24px
    h3: { fontWeight: 700, fontSize: '1.25rem',  lineHeight: 1.3  }, // 20px
    h4: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.3  }, // 18px
    h5: { fontWeight: 600, fontSize: '1rem',     lineHeight: 1.35 }, // 16px
    h6: { fontWeight: 600, fontSize: '0.9375rem',lineHeight: 1.4  }, // 15px
    // ── Labels / subtitles: medium weight ──
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.5 }, // 15px
    subtitle2: { fontWeight: 600, fontSize: '0.875rem',  lineHeight: 1.5 }, // 14px
    // ── Body / data: regular weight ──
    body1: { fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.6 }, // 15px
    body2: { fontWeight: 400, fontSize: '0.875rem',  lineHeight: 1.6 }, // 14px
    // ── Small text ──
    caption:  { fontWeight: 400, fontSize: '0.8125rem', lineHeight: 1.5 }, // 13px
    overline: { fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.5 }, // 12px
    // ── Buttons: medium weight, no caps ──
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    // ── Buttons: one consistent size system ──
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          // Default (medium) size
          height: '40px',
          padding: '0 20px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          lineHeight: 1,
          borderRadius: '10px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeSmall: {
          height: '32px',
          padding: '0 14px',
          fontSize: '0.8125rem',
          borderRadius: '8px',
        },
        sizeLarge: {
          height: '48px',
          padding: '0 28px',
          fontSize: '1rem',
          borderRadius: '12px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: '8px' },
        sizeMedium: { width: '40px', height: '40px' },
        sizeSmall:  { width: '32px', height: '32px' },
      },
    },
    // ── Typography ──
    MuiTypography: {
      styleOverrides: {
        overline: { display: 'block', marginBottom: '4px', color: '#64748b' },
      },
    },
    // ── Table: header bold, body regular ──
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          fontWeight: 400,
          padding: '12px 16px',
          color: '#0f172a',
        },
        head: {
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          backgroundColor: '#f8fafc',
        },
      },
    },
    // ── Chips: consistent small size ──
    MuiChip: {
      styleOverrides: {
        root:      { fontSize: '0.8125rem', fontWeight: 500, height: '26px' },
        sizeSmall: { fontSize: '0.75rem',   fontWeight: 500, height: '22px' },
        label:     { paddingLeft: '10px', paddingRight: '10px' },
      },
    },
    // ── Inputs ──
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            fontSize: '0.9375rem',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#cbd5e1' },
          },
          '& .MuiInputLabel-root': { fontSize: '0.9375rem' },
          '& .MuiInputBase-input': { fontWeight: 400 },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '0.9375rem', fontWeight: 400 },
      },
    },
    // ── Tabs ──
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          fontWeight: 500,
          textTransform: 'none',
          minHeight: '44px',
          '&.Mui-selected': { fontWeight: 700 },
        },
      },
    },
    // ── Menu items ──
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.9375rem', fontWeight: 400, minHeight: '40px' },
      },
    },
    // ── Alerts ──
    MuiAlert: {
      styleOverrides: {
        message: { fontSize: '0.9375rem', fontWeight: 400 },
      },
    },
    // ── Tooltips ──
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.8125rem', fontWeight: 400 },
      },
    },
    // ── Cards ──
    MuiCard: {
      styleOverrides: { root: { borderRadius: '16px' } },
    },
    // ── List items ──
    MuiListItemText: {
      styleOverrides: {
        primary:   { fontSize: '0.9375rem', fontWeight: 400 },
        secondary: { fontSize: '0.8125rem', fontWeight: 400 },
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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <Route path="/appointments" element={<StatusDashboard />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/emr" element={<RoleGuard allowedRoles={['Admin','Doctor','Patient']}><PatientEMRPage /></RoleGuard>} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/inventory" element={<RoleGuard allowedRoles={['Admin','Receptionist']}><InventoryListPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={['Admin']}><ReportsPage /></RoleGuard>} />
          <Route path="/receptionists" element={<RoleGuard allowedRoles={['Admin']}><ReceptionistListPage /></RoleGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/book/:doctorId" element={<BookingPage />} />
          <Route path="/video-consultations" element={<RoleGuard allowedRoles={['Doctor', 'Admin', 'Receptionist']}><VideoStatusDashboard /></RoleGuard>} />
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
