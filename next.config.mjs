/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_EXPORT === 'true' ? { output: 'export' } : {}),
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  devIndicators: {
    appIsrStatus: false,
  }
};

export default nextConfig;
