/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

// Apply PWA configuration only in production
const config = process.env.NODE_ENV === 'production' 
  ? require('@ducanh2912/next-pwa').default({
      dest: 'public',
      disable: false,
      register: true,
      skipWaiting: true,
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
      swcMinify: true,
      workboxOptions: {
        disableDevLogs: true,
      }
    })(nextConfig)
  : nextConfig;

module.exports = config;
