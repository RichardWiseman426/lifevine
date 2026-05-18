import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Pin workspace root so Next doesn't get confused by sibling lockfiles
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ikiwhhuxodegpwuuqblz.supabase.co' },
    ],
  },
}

export default nextConfig
