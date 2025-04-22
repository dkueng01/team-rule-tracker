"use client"
import { useUser } from "@stackframe/stack";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Team } from "@/types/team";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeamsPage() {
  useUser({ or: 'redirect' });
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    if (!createName.trim()) {
      setCreateError("Team name is required")
      setCreateLoading(false)
      return
    }
    const res = await fetch("/api/my-teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, description: createDescription }),
    })
    if (!res.ok) {
      const data = await res.json()
      setCreateError(data.error || "Failed to create team")
      setCreateLoading(false)
      return
    }

    setShowCreateDialog(false)
    setCreateLoading(false)
    setCreateError(null)
    setCreateName("")
    setCreateDescription("")

    setLoading(true)
    const teamsRes = await fetch("/api/my-teams")
    const teamsData = await teamsRes.json()
    setUserTeams(teamsData)
    setLoading(false)
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
            Welcome, <Link href="/handler/account-settings" className="text-foreground font-medium underline hover:text-primary">{user.primaryEmail}</Link>!
          </h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Teams</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                Create New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
                <DialogDescription>
                  You can only create one team. Enter a name and (optionally) a description.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleCreateTeam}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    disabled={createLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Input
                    id="team-description"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    disabled={createLoading}
                  />
                </div>
                {createError && (
                  <div className="text-red-500 text-sm">{createError}</div>
                )}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Team"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
