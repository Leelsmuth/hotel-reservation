/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser tests run their own server with NEXT_DIST_DIR=.next-e2e, so
  // it doesn't clash with a dev server using .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
