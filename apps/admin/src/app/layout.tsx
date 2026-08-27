import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ThemeSync } from '@/theme/ThemeSync';
import { AdminQueryProvider } from '@/components/providers/AdminQueryProvider';

export const metadata: Metadata = {
  title: 'SocialPilot AI Pro — Admin Control Center',
  description: 'White-Label & AI Configuration Master Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ThemeSync />
          <AdminQueryProvider>
            {children}
          </AdminQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

