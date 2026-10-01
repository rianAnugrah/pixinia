import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/reader/assets/*": ["./content/comic/*.svg"] },
  async redirects() {
    return [{ source: "/admin/stories/:slug/:path*", destination: "/studio/stories/:slug/:path*", permanent: false }];
  },
};

export default nextConfig;
