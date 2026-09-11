import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TVS Dealer Super Cup | September 2026",
  description: "TVS Certified Dealer Super Cup — Compete, earn points, and climb the leaderboard in the ultimate dealer engagement challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏆</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
