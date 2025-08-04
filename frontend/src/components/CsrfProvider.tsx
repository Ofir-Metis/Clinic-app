import React, { createContext, useContext, ReactNode } from 'react';
import { useCsrfToken } from '../hooks/useCsrfToken';

interface CsrfContextType {
  token: string | null;
  config: {
    headerName: string;
    fieldName: string;
    cookieName: string;
    paramName: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  clearToken: () => Promise<void>;
  getTokenForRequest: () => string | null;
  isTokenExpired: () => boolean;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

interface CsrfProviderProps {
  children: ReactNode;
}

/**
 * CSRF Token Provider Component
 * 
 * Provides CSRF token management throughout the React application.
 * Should be placed near the root of your component tree.
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <CsrfProvider>
 *       <BrowserRouter>
 *         <Routes>
 *           <Route path="/*" element={<AppRoutes />} />
 *         </Routes>
 *       </BrowserRouter>
 *     </CsrfProvider>
 *   );
 * }
 * ```
 */
export function CsrfProvider({ children }: CsrfProviderProps) {
  const csrfToken = useCsrfToken();

  return (
    <CsrfContext.Provider value={csrfToken}>
      {children}
    </CsrfContext.Provider>
  );
}

/**
 * Hook to access CSRF token context
 * 
 * @throws Error if used outside of CsrfProvider
 * @returns CSRF token context
 * 
 * @example
 * ```typescript
 * function MyForm() {
 *   const { getTokenForRequest } = useCsrfContext();
 *   
 *   const handleSubmit = async (data) => {
 *     await api.post('/users', data, {
 *       headers: {
 *         'X-CSRF-Token': getTokenForRequest()
 *       }
 *     });
 *   };
 * }
 * ```
 */
export function useCsrfContext(): CsrfContextType {
  const context = useContext(CsrfContext);
  
  if (context === undefined) {
    throw new Error('useCsrfContext must be used within a CsrfProvider');
  }
  
  return context;
}

/**
 * HOC to inject CSRF token into component props
 */
export function withCsrfToken<P extends object>(
  Component: React.ComponentType<P & { csrfToken: string | null }>
) {
  return function CsrfWrappedComponent(props: P) {
    const { token } = useCsrfContext();
    
    return <Component {...props} csrfToken={token} />;
  };
}