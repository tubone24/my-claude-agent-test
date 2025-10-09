/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CAGENT_API_BASE_URL: process.env.CAGENT_API_BASE_URL || 'http://localhost:8080/api',
  },
}

module.exports = nextConfig
