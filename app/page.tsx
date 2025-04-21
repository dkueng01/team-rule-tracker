"use client"
import { useUser } from "@stackframe/stack";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Team } from "@/types/team";

export default function TeamsPage() {
  useUser({ or: 'redirect' });
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchUserTeams() {
      setLoading(true);
      const res = await fetch("/api/my-teams");
      const data = await res.json();
      setUserTeams(data);
      setLoading(false);
    }

    fetchUserTeams();
  }, [])

  const handleLogout = () => {
    if (!user) return
    user.signOut()
    router.push("/")
  }

  const handleTeamClick = (teamId: number) => {
    router.push(`/teams/${teamId}`)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Team Rule Tracker</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5" />
          <h2 className="text-lg font-medium">
            Welcome, {user.primaryEmail}!
          </h2>
        </div>

        <h2 className="text-2xl font-bold mb-4">Your Teams</h2>

        {userTeams.length === 0 ?
        loading === false ?
        <div className="flex flex-col items-center justify-center h-full">
          <p>You are not a member of any teams.</p>
        </div>
        : <div className="flex flex-col items-center justify-center h-full">
          <p>Loading ...</p>
        </div> : (
          <div className="flex flex-wrap gap-4">
            {userTeams.map((team) => (
              <Card
                key={team.id}
                className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-1rem)] cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTeamClick(team.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Members: {team.memberCount}</p>
                  <p className="text-sm">Rules: {team.ruleCount}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => handleTeamClick(team.id)}>
                    View Team
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
