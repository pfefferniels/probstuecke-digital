import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['verovio', 'jsdom', 'w3c-xmlserializer'],
}

export default nextConfig
