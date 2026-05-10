import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import App from './App';
import './tokens.css';

// Capture the PWA install prompt as early as possible — it fires before React mounts
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

function Root() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[App] Service worker registered');

          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'UPDATE_AVAILABLE') {
              console.log('[App] Update available');
              setUpdateAvailable(true);
            }
          });
        })
        .catch((err) => console.error('[App] SW registration failed:', err));
    }
  }, []);

  return (
    <React.StrictMode>
      {updateAvailable && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'var(--moss)',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
        }}>
          <span>Update available</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'white',
              color: 'var(--moss)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 4,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Reload
          </button>
        </div>
      )}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
