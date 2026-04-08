export const logger = {
  info(message: string, payload?: unknown) {
    console.log(`[mobile] ${message}`, payload ?? '');
  },
  warn(message: string, payload?: unknown) {
    console.warn(`[mobile] ${message}`, payload ?? '');
  },
  error(message: string, payload?: unknown) {
    console.error(`[mobile] ${message}`, payload ?? '');
  },
};
