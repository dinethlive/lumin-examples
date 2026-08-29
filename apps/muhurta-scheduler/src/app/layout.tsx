import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muhurta Scheduler",
  description:
    "Say what you are planning, give the window and the hours you can use, and get one elected moment with the reason stated. No score, no ranked list.",
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
