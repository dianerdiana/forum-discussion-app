import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { appConfig } from '@/configs/app-config';
import type { UserData } from '@/types/user-data-type';

import { STORAGE_KEYS } from './constants/storage-key';
import { USER_ROLES } from './constants/user-role';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat(appConfig.localCurrency, {
    style: 'currency',
    currency: appConfig.currency,
    minimumFractionDigits: 0,
  }).format(value);

export const formatThousandNumber = (value: number) => value.toLocaleString(appConfig.localCurrency);

export const isObjEmpty = (obj: any) => Object.keys(obj).length === 0;

export const capitalize = (text: string): string => {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getUserData = (): UserData => JSON.parse(localStorage.getItem(STORAGE_KEYS.userData) || '{}');
export const setUserData = (userData: UserData) =>
  localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(userData));

export const getHomeRouteForLoggedInUser = (role?: string) => {
  if (role && (role === USER_ROLES.admin || role === USER_ROLES.sale)) {
    return '/dashboard';
  }

  return '/login';
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const postedAt = (date: string): string => {
  const now = new Date().getTime();
  const posted = new Date(date).getTime();
  const diff = now - posted;
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffSeconds = Math.floor(diff / 1000);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }
  if (diffSeconds > 0) {
    return `${diffSeconds}s ago`;
  }
  return 'just now';
};
