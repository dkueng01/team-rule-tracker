"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = (e: any) => {
    e.preventDefault()

    // Simple validation
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    // Mock authentication - in a real app, this would call an API
    if (username === "user" && password === "password") {
      localStorage.setItem("user", JSON.stringify({ username, role: "user" }))
      router.push("/teams")
    } else if (username === "admin" && password === "admin") {
      localStorage.setItem("user", JSON.stringify({ username, role: "admin" }))
      router.push("/teams")
    } else {
      setError("Invalid credentials. Try user/password or admin/admin")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Team Rule Tracker</CardTitle>
          <CardDescription className="text-center">Sign in to manage your team rules and finances</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-[#255F38] hover:bg-[#1d4a2c]">
              Sign In
            </Button>

            <div className="text-sm text-muted-foreground text-center mt-2">
              <p>Demo credentials:</p>
              <p>User: user/password</p>
              <p>Admin: admin/admin</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

