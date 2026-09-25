import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "../globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Admin · Loopcraft",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
