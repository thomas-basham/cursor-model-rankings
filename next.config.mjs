/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/credential-provider-node",
    "@aws-sdk/lib-dynamodb",
  ],
};

export default nextConfig;
