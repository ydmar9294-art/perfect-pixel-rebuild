/**
 * Security Headers Utility
 * Applies client-side security measures compatible with Lovable iframe embedding
 */

/**
 * Apply Content Security Policy via meta tag
 * This is a safe CSP that works within Lovable's iframe context
 */
export const applySecurityMeta = () => {
  // Check if CSP meta already exists
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) return;

  // Create CSP meta tag - permissive enough for Lovable but still adds protection
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.lovable.app",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app https://*.lovable.dev",
    "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; ');
  
  document.head.prepend(cspMeta);

  // Add X-Content-Type-Options
  const xContentType = document.createElement('meta');
  xContentType.httpEquiv = 'X-Content-Type-Options';
  xContentType.content = 'nosniff';
  document.head.appendChild(xContentType);

  // Add Referrer-Policy
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrer);
};

/**
 * Hash a string using SHA-256 for rate limiting
 * Used to hash IPs and emails for login attempt tracking
 */
export const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a fingerprint for rate limiting (IP-like identifier)
 * Since we can't get real IP in browser, we use a combination of factors
 */
export const generateClientFingerprint = async (): Promise<string> => {
  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '0'
  ].join('|');
  
  return hashString(factors);
};
