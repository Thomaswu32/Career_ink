import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareerInk — AI-Powered IT Career Transition Platform',
  description: 'Discover your perfect IT career path in 30–45 minutes based on your skills and personality profile.',
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'CareerInk',
    description: 'From Career Confusion to Clear Career Direction in 30–45 Minutes',
    images: [{ url: '/logo.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
