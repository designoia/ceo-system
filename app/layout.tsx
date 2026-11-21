import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { SyncProvider } from '@/lib/sync/SyncProvider';
import { AppShell } from '@/components/layout/AppShell';

import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { UpdateBanner } from '@/components/pwa/UpdateBanner';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CEO OS — 5-Year Plan → Today\'s Action',
  description: 'Personal 5-year execution operating system. Turn large vision into one clear daily action.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Designoia" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <StoreProvider>
          <SyncProvider>
          <ServiceWorkerRegistration />
          <UpdateBanner />
          <OfflineIndicator />
          <InstallPrompt />

          <AppShell>{children}</AppShell>
          </SyncProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
