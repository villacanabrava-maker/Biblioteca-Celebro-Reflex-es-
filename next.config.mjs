/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora checagens de lint durante o build para garantir que builds não travem
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
