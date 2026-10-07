export type ManagerSession = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const STORAGE_KEY = "clientlens.managerSession";

export function getManagerSession(): ManagerSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as ManagerSession) : null;
  } catch {
    return null;
  }
}

export function saveManagerSession(session: ManagerSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearManagerSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function isManagerAuthenticated() {
  const session = getManagerSession();
  return Boolean(session && session.role === "MANAGER");
}
