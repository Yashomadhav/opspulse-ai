import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: "OpsPulse AI — Operations Control Tower",
  description:
    "Real-time operations intelligence platform for throughput, backlog, SLA risk, and staffing decisions across warehouse and fulfilment operations.",
  keywords: [
    "operations analytics",
    "warehouse management",
    "SLA monitoring",
    "throughput tracking",
    "staffing optimization",
  ],
  authors: [{ name: "OpsPulse AI" }],
  openGraph: {
    title: "OpsPulse AI — Operations Control Tower",
    description:
      "Real-time operations intelligence for fulfilment and logistics operations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
