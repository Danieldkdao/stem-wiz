import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse",
  description:
    "Synapse is the platform where developers can hone their skills and become the best versions of themselves.",
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableColorScheme
          disableTransitionOnChange
        >
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
