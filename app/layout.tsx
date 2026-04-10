import type { Metadata } from "next";
import "./globals.css";
import { ShoeProvider } from "@/context/ShoeContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Blackjack",
  description: "Blackjack card counting trainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ShoeProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </ShoeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}