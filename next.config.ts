import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/reader/assets/*": ["./content/comic/*.svg"] },
};

export default nextConfig;
