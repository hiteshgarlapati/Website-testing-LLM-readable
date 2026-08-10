export function adminSecret() {
  return (import.meta.env.ADMIN_SECRET || process.env.ADMIN_SECRET || '').trim();
}

export function adminAuthRequired() {
  return process.env.NODE_ENV === 'production';
}

export function assertAdminAuthorized(request, formSecret) {
  const expected = adminSecret();
  if (adminAuthRequired() && !expected) {
    return 'Admin uploads are disabled: set ADMIN_SECRET in the server environment.';
  }
  if (!expected) return null;
  const header = request.headers.get('x-admin-secret');
  if (header === expected || formSecret === expected) return null;
  return 'Invalid admin secret.';
}
