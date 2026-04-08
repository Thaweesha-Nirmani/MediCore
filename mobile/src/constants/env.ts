import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppEnvironment = 'development' | 'staging' | 'production';

function normalizeUrl(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function normalizeAppEnvironment(value?: string | null): AppEnvironment {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'production') {
    return 'production';
  }

  if (normalized === 'staging') {
    return 'staging';
  }

  return 'development';
}

function getExpoDevServerHost() {
  const manifest = Constants.manifest ?? (Constants as any).manifest2;
  const debuggerHost = manifest?.debuggerHost || manifest?.packagerOpts?.host;
  if (!debuggerHost || typeof debuggerHost !== 'string') {
    return '';
  }

  const [host] = debuggerHost.split(':');
  return host || '';
}

function getLocalDevelopmentApiBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api/v1';
  }

  return 'http://127.0.0.1:5001/api/v1';
}

function getExpoDevelopmentApiBaseUrl() {
  const host = getExpoDevServerHost();
  if (!host || /(localhost|127\.0\.0\.1)/i.test(host)) {
    return '';
  }

  return `http://${host}:5001/api/v1`;
}

function isLocalHostUrl(value: string) {
  return /(localhost|127\.0\.0\.1|10\.0\.2\.2)/i.test(value);
}

function toPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const appEnv = normalizeAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const explicitApiBaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const environmentApiBaseUrls: Record<AppEnvironment, string> = {
  development:
    normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL_DEVELOPMENT) ||
    normalizeUrl(getExpoDevelopmentApiBaseUrl()) ||
    getLocalDevelopmentApiBaseUrl(),
  staging: normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL_STAGING),
  production: normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL_PRODUCTION),
};

const apiBaseUrl = explicitApiBaseUrl || environmentApiBaseUrls[appEnv];
const isApiBaseUrlConfigured =
  Boolean(apiBaseUrl) && (appEnv === 'development' || !isLocalHostUrl(apiBaseUrl));
const apiBaseUrlMessage = isApiBaseUrlConfigured
  ? ''
  : appEnv === 'development'
    ? 'Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL_DEVELOPMENT for local development.'
    : `Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL_${appEnv.toUpperCase()} to a real deployed host for ${appEnv} builds.`;

export const env = {
  apiBaseUrl,
  apiBaseUrlMessage,
  isApiBaseUrlConfigured,
  appEnv,
  requestTimeoutMs: toPositiveNumber(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS, 15000),
};
