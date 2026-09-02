import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
            <Toaster
              position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#F1F5F9',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '12px',
                padding: '10px 14px',
                maxWidth: '340px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                border: '1px solid rgba(255,255,255,0.08)',
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#fff' },
              },
            }}
            containerStyle={{ top: 16, right: 16 }}
          />
        </AuthProvider>
      </LanguageProvider>
    </body>
  </html>
);
}
