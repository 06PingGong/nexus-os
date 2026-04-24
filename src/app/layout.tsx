import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/context/AppContext";
import AuthGate from "@/components/AuthGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus | 个人操作系统",
  description: "您的个人效率与知识中心",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>
          <AuthGate>
            <div className="layout-container">
              <Sidebar />
              <main>
                {children}
              </main>
            </div>
          </AuthGate>
        </AppProvider>
      </body>
    </html>
  );
}
