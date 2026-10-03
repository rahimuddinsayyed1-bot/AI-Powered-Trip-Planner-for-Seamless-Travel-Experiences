/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  devIndicators: {
    appIsrStatus: false, // Optional: clean up dev UI if needed
  }
};

export default nextConfig;
