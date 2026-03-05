// Dynamic API URL - uses same host as frontend for LAN access
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use the same hostname as the frontend, with API port 4000
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:4000`;
};

export const API_URL = getApiUrl();
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const COACH_SERVICE_URL = import.meta.env.VITE_COACH_SERVICE_URL || API_URL;
// Add other env exports as needed 