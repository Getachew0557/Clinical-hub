import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import AdminBillingPage from './pages/Admin/AdminBillingPage';
import AuditLogPage from './pages/Admin/AuditLogPage';
import BroadcastPage from './pages/Admin/BroadcastPage';
import PrescriptionsPage from './pages/Doctor/PrescriptionsPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import FindDoctorPage from './pages/Patient/FindDoctorPage';
import appointmentService from './api/appointment.service';
import { Card, CardContent, CircularProgress, Box, Typography, Button, Chip } from '@mui/material';
import { Video as VideoIcon } from 'lucide-react';

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

// ── Patient Video Consultations — shows patient's own video appointments ──
const PatientVideoConsultations = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    appointmentService.getMyAppointments()
      .then(data => {
        const all = data.appointments || [];
        setAppointments(all.filter(a => a.type === 'video'));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const active = appointments.filter(a => ['Confirmed', 'In Progress'].includes(a.status));
  const past   = appointments.filter(a => a.status === 'Completed');

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
      <Box className="flex flex-col gap-6">
        <Box className="flex items-center gap-3">
          <Box sx={{ w: 40, h: 40, bgcolor: '#f0fdfa', borderRadius: 3, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VideoIcon className="text-teal-600 w-5 h-5" />
          </Box>
          <Box>
            <Typography variant="h5" color="text.primary">My Video Consultations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Your scheduled and past video appointments
            </Typography>
          </Box>
        </Box>

        {appointments.length === 0 ? (
          <Card elevation={0} sx={{ border: '1px dashed #e2e8f0', borderRadius: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
              <VideoIcon size={48} className="text-slate-300" />
              <Typography variant="body1" fontWeight={600} color="text.secondary">No video consultations yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 320 }}>
                Book a video consultation with a doctor to get started.
              </Typography>
              <Button variant="contained" sx={{ borderRadius: 3, mt: 1 }} onClick={() => navigate('/find-doctor')}>
                Find a Doctor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {active.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Active Sessions</Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {active.map(apt => (
                    <Card key={apt.id} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, '&:hover': { borderColor: '#0d9488', boxShadow: '0 4px 12px rgba(13,148,136,0.1)' }, transition: 'all 0.2s' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip
                            label={apt.status === 'In Progress' ? '🔴 Live' : '📹 Ready'}
                            size="small"
                            sx={{ bgcolor: apt.status === 'In Progress' ? '#f0fdf4' : '#eff6ff', color: apt.status === 'In Progress' ? '#059669' : '#2563eb', fontWeight: 800 }}
                          />
                          <VideoIcon size={18} className="text-teal-500" />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                          Dr. {apt.doctorName || 'Doctor'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          {apt.appointmentDate} at {apt.appointmentTime?.slice(0, 5)}
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/video/${apt.id}`)}
                          sx={{ borderRadius: 2 }}
                        >
                          {apt.status === 'In Progress' ? 'Rejoin Session' : 'Join Session'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {past.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Past Sessions</Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {past.map(apt => (
                    <Card key={apt.id} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, opacity: 0.8 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Chip label="✅ Completed" size="small" sx={{ bgcolor: '#f8fafc', color: '#64748b', fontWeight: 700, mb: 2 }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                          Dr. {apt.doctorName || 'Doctor'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {apt.appointmentDate} at {apt.appointmentTime?.slice(0, 5)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

// ── Video Consultations Router — Doctor/Admin/Receptionist see status dashboard, Patient sees their video appointments ──
const VideoConsultationsRouter = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'Patient') {
    return <PatientVideoConsultations />;
  }
  return <VideoStatusDashboard />;
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
          <Route path="/find-doctor" element={<FindDoctorPage />} />
          <Route path="/appointments" element={<StatusDashboard />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/emr" element={<RoleGuard allowedRoles={['Admin','Doctor','Patient']}><PatientEMRPage /></RoleGuard>} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/inventory" element={<RoleGuard allowedRoles={['Admin','Receptionist']}><InventoryListPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={['Admin']}><ReportsPage /></RoleGuard>} />
          <Route path="/admin-billing" element={<RoleGuard allowedRoles={['Admin','Receptionist']}><AdminBillingPage /></RoleGuard>} />
          <Route path="/audit-log" element={<RoleGuard allowedRoles={['Admin']}><AuditLogPage /></RoleGuard>} />
          <Route path="/broadcast" element={<RoleGuard allowedRoles={['Admin']}><BroadcastPage /></RoleGuard>} />
          <Route path="/prescriptions" element={<RoleGuard allowedRoles={['Doctor']}><PrescriptionsPage /></RoleGuard>} />
          <Route path="/user-management" element={<RoleGuard allowedRoles={['Admin']}><UserManagementPage /></RoleGuard>} />
          <Route path="/receptionists" element={<RoleGuard allowedRoles={['Admin']}><ReceptionistListPage /></RoleGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/book/:doctorId" element={<BookingPage />} />
          <Route path="/video-consultations" element={
    <RoleGuard allowedRoles={['Doctor', 'Admin', 'Receptionist', 'Patient']}>
        <VideoConsultationsRouter />
    </RoleGuard>
} />
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
