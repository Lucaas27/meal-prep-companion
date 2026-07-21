import { useContext } from 'react';
import type { AuthState } from './auth-context';
import { AuthContext } from './auth-context';

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
