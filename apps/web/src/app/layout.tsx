import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import RoleSelector from "@/components/RoleSelector";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HomeSphere AI | AI-Powered Smart Home Services",
  description: "Book verified electricians, plumbers, painters, and tech repairs with instant AI issue diagnosis, cost estimations, and real-time technician tracking.",
  keywords: "home services, electrician, plumber, AC repair, India services, home automation, AI home diagnosis, smart home booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${outfit.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          {children}
          <RoleSelector />
        </ThemeProvider>
      </body>
    </html>
  );
}
