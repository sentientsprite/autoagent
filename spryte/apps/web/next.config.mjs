/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@spryte/auditor", "@spryte/core", "@spryte/llm"],
};

export default nextConfig;
