import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AppointmentListPage from './pages/Appointment/AppointmentListPage';
import PatientListPage from './pages/Patient/PatientListPage';
import InventoryListPage from './pages/Inventory/InventoryListPage';

// ── MUI Theme ────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8' },
    secondary: { main: '#64748b' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", "sans-serif"',
    h5: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
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
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── App ──────────────────────────────────────────────────
const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Router>
      <Routes>
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/doctors" element={<DoctorListPage />} />
          <Route path="/appointments" element={<AppointmentListPage />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/emr" element={<PlaceholderPage title="Medical Records" />} />
          <Route path="/billing" element={<PlaceholderPage title="Billing" />} />
          <Route path="/inventory" element={<InventoryListPage />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
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
