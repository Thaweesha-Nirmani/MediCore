import { create } from 'zustand';

export type MobileUser = {
  id: string;
  _id?: string;
  userId?: string;
  name: string;
  email: string;
  contactNumber?: string;
  role: string;
  status: string;
  active?: boolean;
  initials?: string;
  color?: string;
  lastLogin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user?: MobileUser;
};

type AuthStoreState = {
  session: AuthSession | null;
  hasHydrated: boolean;
  isBootstrapping: boolean;
  setSession: (session: AuthSession | null) => void;
  setHydrated: (value: boolean) => void;
  setBootstrapping: (value: boolean) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  session: null,
  hasHydrated: false,
  isBootstrapping: false,
  setSession: (session) => set({ session }),
  setHydrated: (value) => set({ hasHydrated: value }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
  clearSession: () => set({ session: null }),
}));

export const authStore = useAuthStore;
