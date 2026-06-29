import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright-chromium', 'react-dom'],
};

export default nextConfig;
