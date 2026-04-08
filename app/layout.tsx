import type { Metadata } from "next";
import "./globals.css";
import { ShoeProvider } from "@/context/ShoeContext";

export const metadata: Metadata = {
  title: "Blackjack",
  description: "Blackjack card counting trainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ShoeProvider>
          <main className="min-h-screen bg-green-900 text-white">
            {children}
          </main>
        </ShoeProvider>
      </body>
    </html>
  );
}