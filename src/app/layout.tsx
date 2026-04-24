import type { Metadata } from "next";
import "./globals.css";

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
      <body style={{ margin: 0, padding: 0, background: "#000" }}>
        {children}
      </body>
    </html>
  );
}