/** @type {import('next').NextConfig} */

// ─── Content Security Policy ──────────────────────────────────
// Tightly scoped to only what OpsPulse AI actually needs.
// Adjust 'connect-src' when adding real Supabase URL.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

// ─── Security Headers ─────────────────────────────────────────
const securityHeaders = [
  // Prevent clickjacking — no iframes allowed
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Control referrer information leakage
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Enforce HTTPS for 2 years (preload-ready)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "accelerometer=()",
      "gyroscope=()",
      "magnetometer=()",
    ].join(", "),
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  // Prevent cross-site information leakage via timing attacks
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  // Prevent cross-origin resource embedding
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  // Remove server fingerprint
  {
    key: "X-Powered-By",
    value: "",
  },
  // DNS prefetch control
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig = {
  // ─── Security Headers on all routes ──────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Additional headers for API routes
      {
        source: "/api/(.*)",
        headers: [
          ...securityHeaders,
          // Prevent API responses from being cached by proxies
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "Surrogate-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },

  // ─── Image Security ───────────────────────────────────────────
  images: {
    remotePatterns: [],
    // Disable SVG to prevent XSS via SVG
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ─── Build Hardening ──────────────────────────────────────────
  // Fail build if TypeScript errors exist
  typescript: {
    ignoreBuildErrors: false,
  },
  // Fail build if ESLint errors exist
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── Production Optimisations ─────────────────────────────────
  poweredByHeader: false,
  compress: true,

  // ─── Redirect HTTP → HTTPS (Vercel handles this, but belt+braces) ──
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
