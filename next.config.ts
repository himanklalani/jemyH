import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.31.226', '192.168.0.114', '192.168.0.113', '192.168.0.119', '192.168.29.61'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              `default-src 'self'`,
              // Stripe.js and Razorpay Checkout must both be whitelisted
              `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net`,
              `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://api.razorpay.com https://checkout.razorpay.com`,
              `img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com`,
              `media-src 'self' https://res.cloudinary.com`,
              `connect-src 'self' https://api.stripe.com https://api.razorpay.com https://www.google-analytics.com https://*.sentry.io`,
              `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
              `font-src 'self' https://fonts.gstatic.com`,
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // CORS config for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Add 301 redirects here if URLs are restructured in future
      // Example:
      // { source: '/old-path', destination: '/new-path', permanent: true },
    ];
  },
};

export default nextConfig;
