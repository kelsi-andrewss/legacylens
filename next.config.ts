import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment config
  serverExternalPackages: ["@pinecone-database/pinecone"],
};

export default nextConfig;
