import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';
export const metadata: Metadata = {
  title: 'Rentara — A place to call home',
  description:
    'Find a rental that fits your next chapter. Explore homes, save your favourites, send rental requests and manage your own properties.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#214d45' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
