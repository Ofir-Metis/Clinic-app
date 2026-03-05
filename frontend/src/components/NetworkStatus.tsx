import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useTranslation } from '../contexts/LanguageContext';

const NetworkStatus: React.FC = () => {
  const { translations } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineMessage(true);
      // Auto-dismiss the "back online" message after 3 seconds
      setTimeout(() => setShowOnlineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline message - stays visible until back online */}
      <Snackbar
        open={isOffline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" sx={{ width: '100%' }}>
          {translations.network.offline}
        </Alert>
      </Snackbar>

      {/* Back online message - auto-dismisses after 3 seconds */}
      <Snackbar
        open={showOnlineMessage}
        autoHideDuration={3000}
        onClose={() => setShowOnlineMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {translations.network.backOnline}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkStatus;
