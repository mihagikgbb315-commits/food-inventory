import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '冷蔵庫管理',
    short_name: '冷蔵庫管理',
    description: '家族で使える食材在庫管理アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdf4',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
