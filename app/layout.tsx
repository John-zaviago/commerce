// import { Navbar } from 'components/layout/navbar';
import { GeistSans } from 'geist/font/sans';
import { baseUrl } from 'lib/utils';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import './globals.css';

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`
  },
  robots: {
    follow: true,
    index: true
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        <nav className="relative flex items-center justify-between p-4 lg:px-6 border-b">
          <div className="flex w-full items-center">
            <div className="flex w-full md:w-1/3">
              <a href="/" className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6">
                <div className="text-2xl font-bold">WooCommerce Store</div>
              </a>
            </div>
            <div className="hidden justify-center md:flex md:w-1/3">
              <a href="/search" className="text-gray-600 hover:text-gray-900 px-4">All Products</a>
            </div>
            <div className="flex justify-end md:w-1/3">
              <a href="/search" className="text-gray-600 hover:text-gray-900">Search</a>
            </div>
          </div>
        </nav>
        <main>
          {children}
          <Toaster closeButton />
        </main>
      </body>
    </html>
  );
}
