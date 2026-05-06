import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin tracing to this app when another lockfile exists higher on disk (e.g. ~/package-lock.json).
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  serverExternalPackages: ["playwright-core", "@react-pdf/renderer"],
};

export default nextConfig;
