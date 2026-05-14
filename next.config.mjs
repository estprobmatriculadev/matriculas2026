import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido output: 'export' para permitir SSR e Serverless Functions na Vercel
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
