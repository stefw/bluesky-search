import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  }
}

export default config
