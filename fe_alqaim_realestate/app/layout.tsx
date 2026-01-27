
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/UI/ConditionalLayout";
import { AuthProvider } from "@/context/AuthContext";
import { MantineProvider } from "@mantine/core";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Al-Qaim Associates & Builders",
  description: "A real estate platform for Customers and Payment Management.",
    icons: {
    icon: [{ url: "/Gemini_Generated_Image_xgd111xgd111xgd1.ico", sizes: "16x16", type: "image/x-icon" }],
    shortcut: ["/Gemini_Generated_Image_xgd111xgd111xgd1.ico"],
    apple: ["/Gemini_Generated_Image_xgd111xgd111xgd1.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider>
          <AuthProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
