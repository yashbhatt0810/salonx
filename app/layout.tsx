import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";


export const metadata: Metadata = { title: "SalonX", description: "Salon management — billing, customers, staff, expenses" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#16151a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const html = (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider>{html}</ClerkProvider> : html;
}
