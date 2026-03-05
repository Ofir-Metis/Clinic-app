/**
 * Re-export AuthContext from contexts folder for backward compatibility.
 * All new code should import directly from './contexts/AuthContext'.
 */
export {
  AuthProvider,
  useAuth,
  type User,
  type TokenData,
  type AuthContextValue,
  type AuthState,
  type JWTPayload
} from './contexts/AuthContext';
