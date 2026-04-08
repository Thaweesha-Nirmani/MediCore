import type { MobileUser } from '@/store/auth-store';

export function getFirstName(name?: string | null) {
  const cleaned = String(name || '').trim();

  if (!cleaned) {
    return 'Team';
  }

  return cleaned.split(/\s+/)[0] || 'Team';
}

export function getDisplayInitials(
  user?: Pick<MobileUser, 'initials' | 'name'> | null,
  fallback = 'TH'
) {
  const explicitInitials = String(user?.initials || '').trim();

  if (explicitInitials) {
    return explicitInitials.slice(0, 2).toUpperCase();
  }

  const cleanedName = String(user?.name || '').trim();

  if (!cleanedName) {
    return fallback;
  }

  return cleanedName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
