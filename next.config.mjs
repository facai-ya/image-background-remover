/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除 output: "export"，允许 API 路由
  // output: "export",
  images: {
    unoptimized: true,
  },
  // 添加 Cloudflare Pages 支持
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
};

export default nextConfig;