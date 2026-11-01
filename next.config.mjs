/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [{ source: '/tracker', destination: '/tasks', permanent: false }];
  },
};

export default nextConfig;
