/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['ik.imagekit.io', 'res.cloudinary.com'], // <-- put it here
  },
};
export default nextConfig;
