import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['verovio', 'jsdom', 'w3c-xmlserializer'],
  // pages wait for the DTA CAB normalisation service, which can be slow
  staticPageGenerationTimeout: 180,
}

export default nextConfig
