/**
 * Admin session types.
 * The actual session token is stored exclusively in an HTTP-only cookie
 * (set by /api/admin/session). Nothing is stored in localStorage.
 */
export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

export type AdminSession = {
  token: string;
  admin: AdminUser;
};
