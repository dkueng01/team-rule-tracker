"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { payments } from "@/data/payments"
import { ruleBreaks } from "@/data/rule-breaks"
import { rules } from "@/data/rules"
import { teams } from "@/data/teams"
import { users } from "@/data/users"

export default function AdminDashboardPage({ params }: any) {
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [teamRules, setTeamRules] = useState<any[]>([])
  const [teamRuleBreaks, setTeamRuleBreaks] = useState<any[]>([])
  const [teamPayments, setTeamPayments] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [totalPoolAmount, setTotalPoolAmount] = useState(0)
  const [currentPoolAmount, setCurrentPoolAmount] = useState(0)

  // New rule form
  const [newRuleName, setNewRuleName] = useState("")
  const [newRuleDescription, setNewRuleDescription] = useState("")
  const [newRuleAmount, setNewRuleAmount] = useState("")
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false)

  // New rule break form
  const [newBreakRuleId, setNewBreakRuleId] = useState("")
  const [newBreakUserId, setNewBreakUserId] = useState("")
  const [newBreakDescription, setNewBreakDescription] = useState("")
  const [showNewBreakDialog, setShowNewBreakDialog] = useState(false)

  // New payment form
  const [newPaymentUserId, setNewPaymentUserId] = useState("")
  const [newPaymentAmount, setNewPaymentAmount] = useState("")
  const [newPaymentDescription, setNewPaymentDescription] = useState("")
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)

    // Get team data
    const teamData = teams.find((t) => t.id === Number.parseInt(params.id))
    if (!teamData) {
      router.push("/teams")
      return
    }
    setTeam(teamData)

    // Check if user is admin
    const currentUser: any = users.find((u) => u.username === userData.username)
    const isAdmin = userData.role === "admin" || teamData.adminIds.includes(currentUser?.id)

    if (!isAdmin) {
      router.push(`/teams/${params.id}`)
      return
    }

    // Get team rules
    const filteredRules = rules.filter((rule) => rule.teamId === teamData.id)
    setTeamRules(filteredRules)

    // Get team rule breaks
    const filteredRuleBreaks = ruleBreaks.filter((rb) => rb.teamId === teamData.id)
    setTeamRuleBreaks(filteredRuleBreaks)

    // Get team payments
    const filteredPayments = payments.filter((payment) => payment.teamId === teamData.id)
    setTeamPayments(filteredPayments)

    // Get team members
    const teamMemberIds = teamData.memberIds
    const filteredMembers = users.filter((user) => teamMemberIds.includes(user.id))
    setTeamMembers(filteredMembers)

    // Calculate pool amounts
    const totalBreakAmount = filteredRuleBreaks.reduce((total, rb) => {
      const ruleAmount = filteredRules.find((r) => r.id === rb.ruleId)?.amount || 0
      return total + ruleAmount
    }, 0)

    const totalPaymentAmount = filteredPayments.reduce((total, p) => total + p.amount, 0)

    setTotalPoolAmount(totalBreakAmount)
    setCurrentPoolAmount(totalPaymentAmount)
  }, [params.id, router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleBackToTeam = () => {
    router.push(`/teams/${params.id}`)
  }

  const handleAddRule = () => {
    // Validate form
    if (!newRuleName || !newRuleAmount) {
      return
    }

    // In a real app, this would call an API
    const newRule = {
      id: rules.length + 1,
      teamId: team.id,
      name: newRuleName,
      description: newRuleDescription,
      amount: Number.parseFloat(newRuleAmount),
      createdAt: new Date().toISOString(),
    }

    // Update local state
    setTeamRules([...teamRules, newRule])

    // Reset form
    setNewRuleName("")
    setNewRuleDescription("")
    setNewRuleAmount("")
    setShowNewRuleDialog(false)
  }

  const handleAddRuleBreak = () => {
    // Validate form
    if (!newBreakRuleId || !newBreakUserId) {
      return
    }

    // In a real app, this would call an API
    const newBreak = {
      id: ruleBreaks.length + 1,
      teamId: team.id,
      ruleId: Number.parseInt(newBreakRuleId),
      userId: Number.parseInt(newBreakUserId),
      description: newBreakDescription,
      date: new Date().toISOString(),
    }

    // Update local state
    setTeamRuleBreaks([...teamRuleBreaks, newBreak])

    // Update total pool amount
    const ruleAmount = teamRules.find((r) => r.id === Number.parseInt(newBreakRuleId))?.amount || 0
    setTotalPoolAmount(totalPoolAmount + ruleAmount)

    // Reset form
    setNewBreakRuleId("")
    setNewBreakUserId("")
    setNewBreakDescription("")
    setShowNewBreakDialog(false)
  }

  const handleAddPayment = () => {
    // Validate form
    if (!newPaymentUserId || !newPaymentAmount) {
      return
    }

    // In a real app, this would call an API
    const newPayment = {
      id: payments.length + 1,
      teamId: team.id,
      userId: Number.parseInt(newPaymentUserId),
      amount: Number.parseFloat(newPaymentAmount),
      description: newPaymentDescription,
      date: new Date().toISOString(),
    }

    // Update local state
    setTeamPayments([...teamPayments, newPayment])

    // Update current pool amount
    setCurrentPoolAmount(currentPoolAmount + Number.parseFloat(newPaymentAmount))

    // Reset form
    setNewPaymentUserId("")
    setNewPaymentAmount("")
    setNewPaymentDescription("")
    setShowNewPaymentDialog(false)
  }

  if (!user || !team) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackToTeam}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to team</span>
          </Button>
          <h1 className="text-xl font-bold">{team.name} - Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-muted-foreground">Manage rules, track rule breaks, and record payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Money Pool</CardTitle>
              <CardDescription>Current vs expected amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                €{currentPoolAmount.toFixed(2)} / €{totalPoolAmount.toFixed(2)}
              </div>
              <p className="text-muted-foreground">
                {currentPoolAmount < totalPoolAmount
                  ? `€${(totalPoolAmount - currentPoolAmount).toFixed(2)} still to be collected`
                  : "All debts have been paid"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Total: {teamMembers.length} members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <Badge key={member.id} variant="outline" className="px-2 py-1">
                    {member.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules">
          <TabsList className="mb-4">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="breaks">Rule Breaks</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Team Rules</h3>
              <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#255F38] hover:bg-[#1d4a2c]">
                    <Plus className="h-4 w-4 mr-2" /> Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Rule</DialogTitle>
                    <DialogDescription>
                      Create a new rule for your team. Rules define the cost of breaking them.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        placeholder="e.g., Late to meeting"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-description">Description (Optional)</Label>
                      <Textarea
                        id="rule-description"
                        value={newRuleDescription}
                        onChange={(e) => setNewRuleDescription(e.target.value)}
                        placeholder="Describe the rule..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-amount">Amount (€)</Label>
                      <Input
                        id="rule-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newRuleAmount}
                        onChange={(e) => setNewRuleAmount(e.target.value)}
                        placeholder="5.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewRuleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRule} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                      Add Rule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teamRules.length === 0 ? (
              <p>No rules have been created for this team.</p>
            ) : (
              <div className="space-y-4">
                {teamRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge variant="outline" className="bg-[#255F38] text-white">
                          €{rule.amount.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="breaks">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Rule Breaks</h3>
              <Dialog open={showNewBreakDialog} onOpenChange={setShowNewBreakDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#255F38] hover:bg-[#1d4a2c]">
                    <Plus className="h-4 w-4 mr-2" /> Record Rule Break
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Rule Break</DialogTitle>
                    <DialogDescription>Record when a team member breaks a rule.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="break-rule">Rule</Label>
                      <Select value={newBreakRuleId} onValueChange={setNewBreakRuleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rule" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamRules.map((rule) => (
                            <SelectItem key={rule.id} value={rule.id.toString()}>
                              {rule.name} (€{rule.amount.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="break-user">Team Member</Label>
                      <Select value={newBreakUserId} onValueChange={setNewBreakUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="break-description">Description (Optional)</Label>
                      <Textarea
                        id="break-description"
                        value={newBreakDescription}
                        onChange={(e) => setNewBreakDescription(e.target.value)}
                        placeholder="Add details about the rule break..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewBreakDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRuleBreak} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                      Record Break
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teamRuleBreaks.length === 0 ? (
              <p>No rule breaks have been recorded for this team.</p>
            ) : (
              <div className="space-y-4">
                {teamRuleBreaks.map((ruleBreak) => {
                  const rule = teamRules.find((r) => r.id === ruleBreak.ruleId)
                  const userWhoBreak = teamMembers.find((u) => u.id === ruleBreak.userId)
                  return (
                    <Card key={ruleBreak.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{rule?.name}</CardTitle>
                          <Badge variant="outline" className="bg-[#255F38] text-white">
                            €{rule?.amount.toFixed(2)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Broken by: {userWhoBreak?.name} on {new Date(ruleBreak.date).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{ruleBreak.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Payments</h3>
              <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#255F38] hover:bg-[#1d4a2c]">
                    <Plus className="h-4 w-4 mr-2" /> Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>Record when a team member pays their debt.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-user">Team Member</Label>
                      <Select value={newPaymentUserId} onValueChange={setNewPaymentUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Amount (€)</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        placeholder="5.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-description">Description (Optional)</Label>
                      <Textarea
                        id="payment-description"
                        value={newPaymentDescription}
                        onChange={(e) => setNewPaymentDescription(e.target.value)}
                        placeholder="Add details about the payment..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPayment} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                      Record Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teamPayments.length === 0 ? (
              <p>No payments have been recorded for this team.</p>
            ) : (
              <div className="space-y-4">
                {teamPayments.map((payment) => {
                  const userWhoPaid = teamMembers.find((u) => u.id === payment.userId)
                  return (
                    <Card key={payment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Payment</CardTitle>
                          <Badge variant="outline" className="bg-[#255F38] text-white">
                            €{payment.amount.toFixed(2)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Paid by: {userWhoPaid?.name} on {new Date(payment.date).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

