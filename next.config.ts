/** @type {import('next').NextConfig} */
import type { Configuration } from 'webpack';

const config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production'
  },
  transpilePackages: [],
  webpack: (config: Configuration) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
}

export default config
