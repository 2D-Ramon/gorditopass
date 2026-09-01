import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@aws-sdk/client-s3"],
};

export default nextConfig;
