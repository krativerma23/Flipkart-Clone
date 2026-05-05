import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co'          },
      { protocol: 'https', hostname: 'res.cloudinary.com'    },
      { protocol: 'https', hostname: 'images.unsplash.com'   },
      { protocol: 'https', hostname: 'picsum.photos'         },
      // Locally uploaded product images served from the Express backend
      { protocol: 'http',  hostname: 'localhost', port: '5000' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*',     destination: 'http://localhost:5000/api/:path*'     },
      // Proxy uploaded images so the frontend can use relative /uploads/… paths
      { source: '/uploads/:path*', destination: 'http://localhost:5000/uploads/:path*' },
    ];
  },
};

export default nextConfig;
