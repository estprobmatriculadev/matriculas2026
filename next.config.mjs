/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Se houver rotas dinâmicas, o Next.js gerará arquivos HTML estáticos para cada uma
  // No nosso caso, [fluxo] é tratado no lado do cliente via hooks, mas o Next precisa saber
};

export default nextConfig;
