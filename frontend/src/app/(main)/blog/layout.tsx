import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | PlaceNxt',
  description: 'Career tips, interview strategies, resume advice and placement insights from the PlaceNxt team.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
