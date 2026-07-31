import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global listener for unhandled promise rejections and uncaught network/script errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Unhandled Rejection]:', {
    reason: event.reason,
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
  });
});

window.addEventListener('error', (event) => {
  console.error('[Global Uncaught Error]:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

