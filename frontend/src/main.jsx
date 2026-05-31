import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/store';
import theme from './theme';
import './i18n.js';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { queryClient } from './lib/react-query.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </ErrorBoundary>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
