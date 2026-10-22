import { ADMIN_PASSWORD } from '../config';

const STORAGE_KEY = 'admin-access';

export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function adminLogin(password: string): boolean {
  if (password !== ADMIN_PASSWORD) {
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    return true;
  }
  return true;
}
