import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "@mdxeditor/editor/style.css";
import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next";
import "./globals.css";

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
    <NuqsAdapter>
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
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </NuqsAdapter>
  );
}
