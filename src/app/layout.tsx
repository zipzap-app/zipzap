import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ZipZap",
  description: "Create. Share. Earn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body style={{ paddingBottom: 80, background: "#0a0a0a" }}>
        {children}
        <Navbar />
      </body>
    </html>
  );
}