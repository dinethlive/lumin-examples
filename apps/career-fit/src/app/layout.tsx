import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Fit",
  description:
    "A vocational fit and career timing console built from separate, sourced KP tools: promise, fit, mode, timing and blockage, each reported on its own, never blended into one score.",
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
