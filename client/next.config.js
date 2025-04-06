/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.discordapp.com'],
  },
  // Docker内でのAPI通信設定
  env: {
    NEXTAUTH_AUTO_LOGIN: 'false',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_NEXTAUTH_URL: 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        // Docker内部の通信では 'api' サービス名とポート3000を使用
        destination: 'http://api:3000/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      }
    ];
  },
  // TypeScriptエラーを無視する設定
  typescript: {
    ignoreBuildErrors: process.env.NEXT_TYPESCRIPT_CHECK === 'false',
  },
};

module.exports = nextConfig; 