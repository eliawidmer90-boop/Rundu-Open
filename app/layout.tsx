import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rundu Open 2026 | Tennis, just for fun",
  description:
    "A recreational tennis tournament at Kavango River Lodge, Rundu, Namibia. 21 November 2026, with 22 November reserved if required. N$20 entry.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
