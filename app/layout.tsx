import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const clarityCity = localFont({
  src: [
    { path: './fonts/ClarityCity-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ClarityCity-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ClarityCity-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/ClarityCity-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-clarity-city',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'School Pesa — Supporting Education. Changing Futures.',
    template: '%s · School Pesa',
  },
  description: 'Help children and students access the education support they need to learn, grow and thrive.',
  applicationName: 'School Pesa',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    title: 'School Pesa',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'School Pesa',
    description: 'Help children and students access the education support they need to learn, grow and thrive.',
    siteName: 'School Pesa',
    images: [
      {
        url: '/school-pesa-hero.png',
        width: 1264,
        height: 848,
        alt: 'Children learning together in a classroom',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/school-pesa-hero.png'],
  },
}

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f3ee',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={clarityCity.variable}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
