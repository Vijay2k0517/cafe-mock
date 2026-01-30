import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Isai - The Art Café",
  description:
    "Where music and home blend into one. Classical melodies meet homely comfort with delicious food in a soulful setting.",
  keywords: "art café, classical music, coffee, restaurant, Isai",
  openGraph: {
    title: "Isai - The Art Café",
    description: "Where music and home blend into one",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    siteName: "Isai",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
