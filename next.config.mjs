/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone solo en Docker: en Windows local falla por permisos de symlink
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
