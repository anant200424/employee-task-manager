import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexus — Employee Workspace",
    template: "%s · Nexus",
  },
  description:
    "Secure employee workspace for task management, profile, and team collaboration.",
  icons: {
    icon: "/favicon.svg",
  },
};

import { ThemeHydration } from "@/components/providers/ThemeHydration";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body>
        <ThemeHydration />
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </SocketProvider>
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 2500,
                style: {
                  background: '#0F172A',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: '10px 16px',
                  maxWidth: '360px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                success: {
                  iconTheme: { primary: '#10B981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
              }}
              containerStyle={{ top: 20, right: 20 }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
