import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

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
// Call await turnstileRef.current.getToken() right before invoking a
// protected backend function.
const Turnstile = forwardRef(function Turnstile({ className }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const currentTokenRef = useRef("");
  const tokenResolveRef = useRef(null);
  const [siteKey, setSiteKey] = useState(null);
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
    let cancelled = false;
    base44.functions.invoke("get-public-config", {})
      .then((res) => { if (!cancelled) setSiteKey(res.data?.turnstileSiteKey || ""); })
      .catch(() => { if (!cancelled) setError("Verification unavailable"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
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
  }, [siteKey, handleToken]);

  if (error) return <p className="text-xs text-destructive">{error}</p>;
  if (!siteKey) return <div className="h-[65px]" />;
  return <div ref={containerRef} className={className} />;
});

export default Turnstile;