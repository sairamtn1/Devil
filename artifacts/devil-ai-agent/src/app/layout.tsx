import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DEVIL - Autonomous AI Agent',
  description: 'AI-powered autonomous software engineering platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
