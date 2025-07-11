Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3000',
      VITE_GOOGLE_CLIENT_ID: 'test-client-id',
      // Add other env vars as needed
    }
  }
}); 