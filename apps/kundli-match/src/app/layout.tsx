import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kundli Match",
  description:
    "Three compatibility systems, side by side, and the places they disagree. Vedic Ashta Koota, the KP seven-factor score, and the rigorous KP cuspal-sub-lord read.",
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
