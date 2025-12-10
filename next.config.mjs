/** @type {import('next').NextConfig} */
//added host upload.wikimedia.org
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [new URL('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/**')],
  },
};

export default nextConfig;
