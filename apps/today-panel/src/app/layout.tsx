import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Today Panel",
  description:
    "Panchang, choghadiya and hora for any city, computed live. No account, no personal data.",
  // A demo deployment has no business in an index.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
