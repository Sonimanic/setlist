const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
    outputFileTracingRoot: __dirname,
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/*',
        'data/backups/**/*',
      ],
    },
  },
  webpack: (config, { isServer }) => {
    // Ignore backup files and large directories
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.next', '**/out', '**/data/backups/**', '**/data/**/*.json']
    };

    // Add null loader for backup files
    config.module.rules.push({
      test: /[\\/]data[\\/]backups[\\/].*\.json$/,
      use: 'null-loader'
    });

    // Reduce the impact of source maps
    if (!isServer) {
      config.devtool = process.env.NODE_ENV === 'production' ? false : 'eval-source-map';
    }

    // Optimize build performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = withPWA(nextConfig);
