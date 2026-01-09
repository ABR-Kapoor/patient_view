/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aurasutra/shared-lib'],
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  env: {
    PORT: '3000',
  },
  // Custom server port
  serverRuntimeConfig: {
    port: 3000,
  },
  publicRuntimeConfig: {
    port: 3000,
  },
};

module.exports = nextConfig;
