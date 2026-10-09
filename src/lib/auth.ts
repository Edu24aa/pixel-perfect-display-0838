export type ManagerSession = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const STORAGE_KEY = "clientlens.managerSession";
const INTERNAL_ROLE_VALUES = new Set(["ADMIN", "MANAGER", "CONSULTANT"]);

export function normalizeUserRole(role?: string | null): string {
  const value = String(role ?? "").trim().toUpperCase();

  switch (value) {
    case "GESTOR":
      return "MANAGER";
    case "CONSULTOR":
      return "CONSULTANT";
    default:
      return value;
  }
}

export function formatUserRoleLabel(role?: string | null): string {
  switch (normalizeUserRole(role)) {
    case "ADMIN":
      return "Administrador(a)";
    case "CONSULTANT":
      return "Consultor(a)";
    case "MANAGER":
    default:
      return "Gestor(a)";
  }
}

export function getManagerSession(): ManagerSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as ManagerSession;
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      role: normalizeUserRole(parsed.role),
    };
  } catch {
    return null;
  }
}

export function saveManagerSession(session: ManagerSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...session,
      role: normalizeUserRole(session.role),
    }),
  );
}

export function clearManagerSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function isInternalUserRole(role?: string | null) {
  return INTERNAL_ROLE_VALUES.has(normalizeUserRole(role));
}

export function isManagerAuthenticated() {
  const session = getManagerSession();
  return Boolean(session && isInternalUserRole(session.role));
}
