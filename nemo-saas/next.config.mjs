/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  serverExternalPackages: ["playwright-core", "@react-pdf/renderer"],
};

export default nextConfig;
