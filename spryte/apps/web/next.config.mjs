/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@spryte/auditor", "@spryte/core", "@spryte/db", "@spryte/llm"],
};

export default nextConfig;
