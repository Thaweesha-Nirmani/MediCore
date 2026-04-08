import type { MobileUser } from '@/store/auth-store';

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: string | number;
  user: MobileUser;
};
