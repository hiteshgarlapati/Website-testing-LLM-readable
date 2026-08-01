// Simple HTTP Basic Auth for the admin.
// Set ADMIN_PASSWORD in the environment (e.g. Vercel project settings) to enable.
// When unset (local development), the admin is open.

const ADMIN_PASSWORD =
  (typeof import.meta !== 'undefined' && import.meta.env?.ADMIN_PASSWORD) ||
  process.env.ADMIN_PASSWORD ||
  '';

/**
 * Returns null when the request is allowed, or a 401 Response that
 * makes the browser show a username/password prompt.
 * Username is ignored; only the password is checked.
 */
export function requireAdmin(request) {
  if (!ADMIN_PASSWORD) return null;

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (password === ADMIN_PASSWORD) return null;
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Oakline Admin"' }
  });
}
