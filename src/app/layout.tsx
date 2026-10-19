import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Business Admin Dashboard | Northstar demo',
  description:
    'An independent, interactive business operations portfolio demo. All data is fictional.',
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
