import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horary Desk",
  description:
    "Ask one question, pick a number 1 to 249, get a reasoned KP horary verdict computed live. No birth date, no signup, no account.",
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
