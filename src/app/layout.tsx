import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STEMWiz",
  description:
    "STEMWiz is the platform that helps anyone prepare for important STEM events so you can perform your best when it really matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        outfitSans.variable,
        outfitSans.className,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col dark">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
