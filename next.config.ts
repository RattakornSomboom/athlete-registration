import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/staff/fitness-tests",
        destination: "/staff/analytics?tab=fitness",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
