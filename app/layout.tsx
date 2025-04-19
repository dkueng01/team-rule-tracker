import { Inter } from "next/font/google"
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Team Rule Tracker",
  description: "Track team rule breaks and finances",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
              {children}
            </ThemeProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
