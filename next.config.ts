import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // uploaded student/teacher photos live in Cloudinary
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
