const isDev = import.meta.env.DEV

const logger = {
  log:   (...args) => { if (isDev) console.log(...args) },
  info:  (...args) => { if (isDev) console.info(...args) },
  warn:  (...args) => { if (isDev) console.warn(...args) },
  error: (...args) => { if (isDev) console.error(...args) },

  captureException: (error, context = {}) => {
    if (isDev) {
      console.error('[Exception]', error, context)
      return
    }

    try {
      const payload = {
        source:    'react-web',
        message:   error?.message || String(error),
        // In production: send only the first stack line (no internal paths)
        // Full stack is only sent in dev where it never leaves the machine
        stack:     error?.stack
                     ? error.stack.split('\n').slice(0, 2).join(' | ')
                     : null,
        context:   {
          // Strip componentStack — it contains full component tree with file paths
          action: context?.action ?? null,
        },
        url:       window.location.pathname, // pathname only, not full href with query params
        userAgent: navigator.userAgent,
      }

      fetch('/api/logs/client', {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        body:      JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // fail-safe
    }
  },
}

export default logger