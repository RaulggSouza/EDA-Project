import { ADMIN_PASSWORD } from '../config';

const STORAGE_KEY = 'admin-access';

let loggedInThisSession = false;

export function isAdminLoggedIn(): boolean {
  if (loggedInThisSession) {
    return true;
  }
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
  loggedInThisSession = true;
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    return true;
  }
  return true;
}
