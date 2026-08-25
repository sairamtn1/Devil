/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/api-client-react', '@workspace/api-client'],
};

export default nextConfig;
