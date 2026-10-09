import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from "react";

// Public Cloudflare Turnstile site key. Safe to expose in the client — it is
// embedded in the page HTML by design. The matching secret key lives
// server-side only (TURNSTILE_SECRET_KEY app secret).
const TURNSTILE_SITE_KEY = "0x4AAAAAAFSS68uagXE82xLg";

let scriptPromise = null;
function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Turnstile script failed")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Cloudflare Turnstile widget. Auto-solves in managed mode and exposes a
// getToken() method (via ref) that resolves with a fresh, single-use token.
// Call `await turnstileRef.current.getToken()` right before invoking a
// protected backend function.
const Turnstile = forwardRef(function Turnstile({ className }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const currentTokenRef = useRef("");
  const tokenResolveRef = useRef(null);
  const [error, setError] = useState("");

  const handleToken = useCallback((token) => {
    currentTokenRef.current = token;
    if (tokenResolveRef.current) {
      const resolve = tokenResolveRef.current;
      tokenResolveRef.current = null;
      currentTokenRef.current = "";
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.reset(widgetIdRef.current); } catch {}
      }
      resolve(token);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (currentTokenRef.current) {
        const token = currentTokenRef.current;
        currentTokenRef.current = "";
        if (widgetIdRef.current !== null && window.turnstile) {
          try { window.turnstile.reset(widgetIdRef.current); } catch {}
        }
        return Promise.resolve(token);
      }
      return new Promise((resolve) => {
        tokenResolveRef.current = resolve;
        setTimeout(() => {
          if (tokenResolveRef.current === resolve) {
            tokenResolveRef.current = null;
            resolve("");
          }
        }, 15000);
      });
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: handleToken,
        "error-callback": () => { currentTokenRef.current = ""; setError("Verification challenge failed"); },
        "expired-callback": () => { currentTokenRef.current = ""; },
        theme: "light",
      });
    }).catch(() => setError("Verification failed to load"));
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [handleToken]);

  if (error) return <p className="text-xs text-destructive">{error}</p>;
  return <div ref={containerRef} className={className} />;
});

export default Turnstile;