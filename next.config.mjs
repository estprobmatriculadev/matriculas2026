import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth/dist/esm/index.esm.js'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore/dist/esm/index.esm.js'),
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app/dist/esm/index.esm.js'),
      'firebase/database': path.resolve(__dirname, 'node_modules/firebase/database/dist/esm/index.esm.js'),
      'firebase/storage': path.resolve(__dirname, 'node_modules/firebase/storage/dist/esm/index.esm.js'),
      'firebase/analytics': path.resolve(__dirname, 'node_modules/firebase/analytics/dist/esm/index.esm.js')
    };
    return config;
  },
};

export default nextConfig;
