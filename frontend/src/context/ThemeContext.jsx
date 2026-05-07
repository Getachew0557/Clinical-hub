import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

export const useColorMode = () => useContext(ColorModeContext);

// ─── Palette definitions ──────────────────────────────────────────────────────
const LIGHT = {
  bg:             '#f8fafc',
  card:           '#ffffff',
  cardHover:      '#f1f5f9',
  border:         '#e2e8f0',
  borderStrong:   '#cbd5e1',
  inputBg:        '#f8fafc',
  textPrimary:    '#0f172a',
  textSecondary:  '#64748b',
  textMuted:      '#94a3b8',
  primary:        '#0d9488',
  primaryLight:   '#ccfbf1',
  primaryDark:    '#0f766e',
};

const DARK = {
  bg:             '#0f172a',
  card:           '#1e293b',
  cardHover:      '#273549',
  border:         '#334155',
  borderStrong:   '#475569',
  inputBg:        '#1e293b',
  textPrimary:    '#f1f5f9',
  textSecondary:  '#94a3b8',
  textMuted:      '#475569',
  primary:        '#14b8a6',
  primaryLight:   '#134e4a',
  primaryDark:    '#0f766e',
};

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const isDark = mode === 'dark';
  const P = isDark ? DARK : LIGHT;

  // Sync <html class="dark"> and CSS variables on every mode change
  useEffect(() => {
    const html = document.documentElement;

    // Toggle Tailwind dark class
    html.classList.toggle('dark', isDark);

    // Inject CSS variables so any element using var(--color-*) responds instantly
    const vars = {
      '--color-bg':             P.bg,
      '--color-surface':        P.bg,
      '--color-card':           P.card,
      '--color-card-hover':     P.cardHover,
      '--color-border':         P.border,
      '--color-border-strong':  P.borderStrong,
      '--color-input-bg':       P.inputBg,
      '--color-text-primary':   P.textPrimary,
      '--color-text-secondary': P.textSecondary,
      '--color-text-muted':     P.textMuted,
      '--color-primary':        P.primary,
      '--color-primary-light':  P.primaryLight,
      '--color-primary-dark':   P.primaryDark,
    };
    Object.entries(vars).forEach(([k, v]) => html.style.setProperty(k, v));
  }, [mode]);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode(prev => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', next);
        return next;
      });
    },
    mode,
  }), [mode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary:   { main: P.primary, light: P.primaryLight, dark: P.primaryDark },
      secondary: { main: '#64748b' },
      background: { default: P.bg, paper: P.card },
      text: {
        primary:   P.textPrimary,
        secondary: P.textSecondary,
        disabled:  P.textMuted,
      },
      divider: P.border,
      action: {
        hover:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        selected: isDark ? 'rgba(20,184,166,0.12)'  : 'rgba(13,148,136,0.08)',
      },
    },
    typography: {
      fontFamily: '"Outfit", system-ui, -apple-system, sans-serif',
      htmlFontSize: 16,
      fontSize: 15,
      h1: { fontWeight: 700, fontSize: '1.75rem',   lineHeight: 1.2  },
      h2: { fontWeight: 700, fontSize: '1.5rem',    lineHeight: 1.25 },
      h3: { fontWeight: 700, fontSize: '1.25rem',   lineHeight: 1.3  },
      h4: { fontWeight: 700, fontSize: '1.125rem',  lineHeight: 1.3  },
      h5: { fontWeight: 600, fontSize: '1rem',      lineHeight: 1.35 },
      h6: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4  },
      subtitle1: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: '0.875rem',  lineHeight: 1.5 },
      body1:     { fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.6 },
      body2:     { fontWeight: 400, fontSize: '0.875rem',  lineHeight: 1.6 },
      caption:   { fontWeight: 400, fontSize: '0.8125rem', lineHeight: 1.5 },
      overline:  { fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.5 },
      button:    { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem' },
    },
    shape: { borderRadius: 8 },
    components: {
      // ── CssBaseline: inject body + global element styles ──────────────────
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: P.bg,
            color: P.textPrimary,
            transition: 'background-color 0.2s ease, color 0.2s ease',
            fontFamily: '"Outfit", system-ui, sans-serif',
          },
          // Make every plain div/section/article respect the theme bg
          '*, *::before, *::after': {
            boxSizing: 'border-box',
          },
          // Inputs
          'input, textarea, select': {
            backgroundColor: P.inputBg,
            color: P.textPrimary,
            borderColor: P.border,
          },
          'input::placeholder, textarea::placeholder': {
            color: P.textMuted,
          },
          // Table
          'th': {
            color: P.textSecondary,
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          },
          // Scrollbar
          '::-webkit-scrollbar': { width: '8px' },
          '::-webkit-scrollbar-track': { background: isDark ? '#1e293b' : 'transparent' },
          '::-webkit-scrollbar-thumb': { background: isDark ? '#334155' : '#cbd5e1', borderRadius: '9999px' },
          '::-webkit-scrollbar-thumb:hover': { background: isDark ? '#475569' : '#94a3b8' },
        },
      },

      // ── Buttons ───────────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            height: '40px', padding: '0 20px',
            fontSize: '0.9375rem', fontWeight: 600,
            lineHeight: 1, borderRadius: '10px',
            boxShadow: 'none', '&:hover': { boxShadow: 'none' },
          },
          sizeSmall: { height: '32px', padding: '0 14px', fontSize: '0.8125rem', borderRadius: '8px' },
          sizeLarge: { height: '48px', padding: '0 28px', fontSize: '1rem',      borderRadius: '12px' },
        },
      },

      // ── Paper / Card ──────────────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: P.card,
            transition: 'background-color 0.2s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: P.card,
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          },
        },
      },

      // ── Table ─────────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.9375rem', fontWeight: 400, padding: '12px 16px',
            color: P.textPrimary,
            borderColor: P.border,
          },
          head: {
            fontSize: '0.8125rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            color: P.textSecondary,
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          },
        },
      },

      // ── Inputs ────────────────────────────────────────────────────────────
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: P.inputBg,
              color: P.textPrimary,
              fontSize: '0.9375rem',
              '& fieldset': { borderColor: P.border },
              '&:hover fieldset': { borderColor: P.borderStrong },
              '&.Mui-focused fieldset': { borderColor: P.primary },
            },
            '& .MuiInputLabel-root': { fontSize: '0.9375rem', color: P.textSecondary },
            '& .MuiInputBase-input': { fontWeight: 400, color: P.textPrimary },
            '& .MuiInputBase-input::placeholder': { color: P.textMuted },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: P.inputBg,
            color: P.textPrimary,
            '& fieldset': { borderColor: P.border },
            '&:hover fieldset': { borderColor: P.borderStrong },
          },
          input: { color: P.textPrimary },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: P.inputBg,
            color: P.textPrimary,
            transition: 'background-color 0.2s ease',
          },
          input: { color: P.textPrimary },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: P.textSecondary, fontSize: '0.9375rem' },
        },
      },

      // ── Select ────────────────────────────────────────────────────────────
      MuiSelect: {
        styleOverrides: {
          select: { fontSize: '0.9375rem', fontWeight: 400, color: P.textPrimary },
          icon: { color: P.textSecondary },
        },
      },

      // ── Menu ──────────────────────────────────────────────────────────────
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: P.card,
            border: `1px solid ${P.border}`,
            boxShadow: isDark
              ? '0 10px 40px rgba(0,0,0,0.5)'
              : '0 10px 40px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.9375rem', fontWeight: 400, minHeight: '40px',
            color: P.textPrimary,
            '&:hover': { backgroundColor: isDark ? '#273549' : '#f1f5f9' },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(13,148,136,0.08)',
            },
          },
        },
      },

      // ── Dialog ────────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: P.card,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { color: P.textPrimary },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { color: P.textPrimary },
        },
      },

      // ── Tabs ──────────────────────────────────────────────────────────────
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: '0.9375rem', fontWeight: 500,
            textTransform: 'none', minHeight: '44px',
            color: P.textSecondary,
            '&.Mui-selected': { fontWeight: 700, color: P.primary },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: P.primary },
        },
      },

      // ── Chip ──────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root:      { fontSize: '0.8125rem', fontWeight: 500, height: '26px' },
          sizeSmall: { fontSize: '0.75rem',   fontWeight: 500, height: '22px' },
          label:     { paddingLeft: '10px', paddingRight: '10px' },
        },
      },

      // ── Alert ─────────────────────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: { backgroundColor: P.card },
          message: { fontSize: '0.9375rem', fontWeight: 400, color: P.textPrimary },
        },
      },

      // ── Tooltip ───────────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.8125rem', fontWeight: 400,
            backgroundColor: isDark ? '#334155' : '#1e293b',
            color: '#f1f5f9',
          },
        },
      },

      // ── Divider ───────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: P.border },
        },
      },

      // ── Switch ────────────────────────────────────────────────────────────
      MuiSwitch: {
        styleOverrides: {
          track: { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
        },
      },

      // ── Icon Button ───────────────────────────────────────────────────────
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            color: P.textSecondary,
            '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
          },
          sizeMedium: { width: '40px', height: '40px' },
          sizeSmall:  { width: '32px', height: '32px' },
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      MuiTypography: {
        styleOverrides: {
          overline: { display: 'block', marginBottom: '4px', color: P.textSecondary },
          root: { color: 'inherit' },
        },
      },

      // ── List ──────────────────────────────────────────────────────────────
      MuiListItemText: {
        styleOverrides: {
          primary:   { fontSize: '0.9375rem', fontWeight: 400, color: P.textPrimary },
          secondary: { fontSize: '0.8125rem', fontWeight: 400, color: P.textSecondary },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { color: P.textSecondary, minWidth: '36px' },
        },
      },

      // ── Autocomplete ──────────────────────────────────────────────────────
      MuiAutocomplete: {
        styleOverrides: {
          paper: { backgroundColor: P.card, border: `1px solid ${P.border}` },
          option: {
            color: P.textPrimary,
            '&:hover': { backgroundColor: isDark ? '#273549' : '#f1f5f9' },
          },
        },
      },

      // ── Backdrop ──────────────────────────────────────────────────────────
      MuiBackdrop: {
        styleOverrides: {
          root: { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' },
        },
      },

      // ── Form controls ─────────────────────────────────────────────────────
      MuiFormLabel: {
        styleOverrides: {
          root: { color: P.textSecondary, fontSize: '0.9375rem' },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { color: P.textMuted, fontSize: '0.8125rem' },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: { color: P.textSecondary },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: { color: P.textSecondary },
        },
      },

      // ── Circular Progress ─────────────────────────────────────────────────
      MuiCircularProgress: {
        styleOverrides: {
          root: { color: P.primary },
        },
      },

      // ── Skeleton ──────────────────────────────────────────────────────────
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#273549' : '#e2e8f0',
          },
        },
      },
    },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
