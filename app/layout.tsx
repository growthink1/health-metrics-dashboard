import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavHeader } from "@/components/NavHeader";
import { ChatDrawer } from "@/components/ChatDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "health-metrics",
  description: "Hugo's personal health metrics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-text flex flex-col page-bg">
        <NavHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 min-w-0 p-6 overflow-x-hidden">{children}</main>
          <ChatDrawer />
        </div>
      </body>
    </html>
  );
}
