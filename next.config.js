const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const isProd = process.env.NODE_ENV === 'production';

module.exports = withPWA({
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? '/BikeTrip' : '',
  assetPrefix: isProd ? '/BikeTrip/' : '',
});
