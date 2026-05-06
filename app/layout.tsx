import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '冷蔵庫管理',
  description: '家族で使える食材在庫管理アプリ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '冷蔵庫管理',
  },
}

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geist.className} min-h-full bg-gray-950`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
