import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Handles SPA fallback redirects from 404.html.
 * When a static host returns 404 for /auth or /native-callback,
 * the 404.html page redirects to /?redirect=/auth preserving the hash fragment.
 * This component intercepts that and navigates to the correct route.
 */
const SpaRedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    if (!redirect) return;

    try {
      const decoded = decodeURIComponent(redirect);
      // Validate it's a relative path (prevent open redirect)
      if (!decoded.startsWith('/') || decoded.startsWith('//')) return;
      navigate(`${decoded}${location.hash ?? ""}`, { replace: true });
    } catch {
      // Invalid redirect path, ignore
    }
  }, [location.search, location.hash, navigate]);

  return null;
};

export default SpaRedirector;
