import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OG DeFi Sentinel — OpenGradient",
  description:
    "TEE-verified DeFi security & analytics agent powered by OpenGradient",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
