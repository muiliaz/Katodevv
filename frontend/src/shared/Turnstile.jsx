import { useEffect, useRef } from 'react';

// Cloudflare Turnstile widget.
//
// The site key is public by design — it ships in the HTML of every page that
// renders the widget. The secret half lives only in Netlify's environment.
export const TURNSTILE_SITE_KEY = '0x4AAAAAAEJJzvmQ68Iwf0jI';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// One script for the whole page, however many widgets ask for it. Kept as a
// module-level promise so simultaneous mounts share a single load.
let scriptPromise = null;

function loadScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve(window.turnstile);
    el.onerror = () => {
      // Let a later mount try again rather than caching the failure forever.
      scriptPromise = null;
      reject(new Error('Turnstile script failed to load'));
    };
    document.head.appendChild(el);
  });

  return scriptPromise;
}

/**
 * Renders the widget and hands the token up.
 *
 * The parent keeps the token and puts it in the request body; the function
 * verifies it before doing anything with the submission.
 *
 * onToken is called with a string when a token is issued, and with null when it
 * expires or the check fails — so the parent can disable submit if it wants to.
 */
export default function Turnstile({ onToken, theme = 'dark' }) {
  const holder = useRef(null);
  const widgetId = useRef(null);
  // Kept in a ref so re-renders of the parent never re-create the widget:
  // rendering twice would burn a token and confuse Cloudflare's duplicate check.
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then((turnstile) => {
        if (cancelled || !holder.current || !turnstile) return;

        widgetId.current = turnstile.render(holder.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme,
          callback:         (token) => cb.current?.(token),
          'expired-callback': () => cb.current?.(null),
          'error-callback':   () => cb.current?.(null),
        });
      })
      .catch(() => {
        // Network blocked, extension blocking Cloudflare, offline. The server
        // side decides what an absent token means; the form stays usable.
        cb.current?.(null);
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [theme]);

  return <div ref={holder} data-testid="turnstile" />;
}
