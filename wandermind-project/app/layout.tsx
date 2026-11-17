import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "WanderMind — plan trips that actually happen",
  description:
    "An AI travel planner that checks your budget, finds the flights, trains and food, and tells you the truth about what your money buys.",
};

export const viewport: Viewport = {
  themeColor: "#08100f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
