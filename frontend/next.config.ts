import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Pexels photos returned by the recipe agent are remote-optimized via next/image.
    // Next 16 deprecated `images.domains` — use remotePatterns.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
