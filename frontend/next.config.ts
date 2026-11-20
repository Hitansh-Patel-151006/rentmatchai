import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/dashboard/tenant',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard/landlord',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard/renter',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard/Renter',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
