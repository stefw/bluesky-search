/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production'
  },
  transpilePackages: [],
  webpack: (config) => {
    if (config.resolve) {
      config.resolve.fallback = { fs: false, path: false };
    }
    return config;
  }
}

export default config
