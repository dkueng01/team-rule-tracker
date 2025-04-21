"use client"
import { useUser } from "@stackframe/stack";

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Plus, ShoppingBag, Pencil, Trash2 } from "lucide-react"

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
import { expenses } from "@/data/expenses"
import { payments } from "@/data/payments"
import { ruleBreaks } from "@/data/rule-breaks"
import { rules } from "@/data/rules"
import { teams } from "@/data/teams"
import { users } from "@/data/users"

export default function AdminDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  useUser({ or: 'redirect' });
  const user = useUser();
  const { teamId } = use(params);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [team, setTeam] = useState<any>(null)
  const [teamRules, setTeamRules] = useState<any[]>([])
  const [teamRuleBreaks, setTeamRuleBreaks] = useState<any[]>([])
  const [teamPayments, setTeamPayments] = useState<any[]>([])
  const [teamExpenses, setTeamExpenses] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [totalPoolAmount, setTotalPoolAmount] = useState(0)
  const [currentPoolAmount, setCurrentPoolAmount] = useState(0)
  const [availablePoolAmount, setAvailablePoolAmount] = useState(0)

  // New rule form
  const [newRuleName, setNewRuleName] = useState("")
  const [newRuleDescription, setNewRuleDescription] = useState("")
  const [newRuleAmount, setNewRuleAmount] = useState("")
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<any | null>(null)


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

  // New expense form
  const [newExpenseAmount, setNewExpenseAmount] = useState("")
  const [newExpenseDescription, setNewExpenseDescription] = useState("")
  const [showNewExpenseDialog, setShowNewExpenseDialog] = useState(false)

  const router = useRouter()

  useEffect(() => {
    async function checkMembership() {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/membership`)
      const data = await res.json()
      setIsMember(data.isMember)
      setIsAdmin(data.isAdmin)
      setLoading(false);
    }

    checkMembership()
  }, [teamId])

  useEffect(() => {
    async function fetchTeamData() {
      if (!isMember || loading) return

      const res = await fetch(`/api/teams/${teamId}/data`)
      const data = await res.json()

      setTeam(data.team)
      setIsAdmin(data.isAdmin)
      setTeamRules(data.rules)
      setTeamRuleBreaks(data.ruleBreaks)
      setTeamPayments(data.payments)
      setTeamExpenses(data.expenses)
      setTeamMembers(data.teamMembers)

      const totalBreakAmount = data.ruleBreaks.reduce((total: number, rb: any) => {
        const ruleAmount = data.rules.find((r: any) => r.id === rb.rule_id)?.amount || 0
        return total + ruleAmount
      }, 0)

      const totalPaymentAmount = data.payments.reduce((total: number, p: any) => total + p.amount, 0)
      const totalExpenseAmount = data.expenses.reduce((total: number, e: any) => total + e.amount, 0)

      setTotalPoolAmount(totalBreakAmount)
      setCurrentPoolAmount(totalPaymentAmount)
      setAvailablePoolAmount(totalPaymentAmount - totalExpenseAmount)
    }

    fetchTeamData()
  }, [isMember, loading, teamId])

  useEffect(() => {
    if (editingRule) {
      setNewRuleName(editingRule.name)
      setNewRuleDescription(editingRule.description)
      setNewRuleAmount(editingRule.amount.toString())
    }
  }, [editingRule])

  const handleLogout = () => {
    user?.signOut();
    router.push("/")
  }

  const handleBackToTeam = () => {
    router.push(`/teams/${teamId}`)
  }

  const handleSaveRule = async () => {
    if (!newRuleName || !newRuleAmount) return

    const payload = {
      name: newRuleName,
      description: newRuleDescription,
      amount: parseFloat(newRuleAmount),
    }

    const url = editingRule
      ? `/api/teams/${teamId}/rules/${editingRule.id}`
      : `/api/teams/${teamId}/rules`

    const method = editingRule ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error("Failed to save rule")
      return
    }

    const rule = await res.json()

    setTeamRules((prev) => {
      if (editingRule) {
        return prev.map((r) => (r.id === rule.id ? rule : r))
      } else {
        return [...prev, rule]
      }
    })

    resetRuleForm()
    setEditingRule(null)
    setShowRuleDialog(false)
  }

  const handleDeleteRule = async (ruleId: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this rule?")
    if (!confirmDelete) return

    const res = await fetch(`/api/teams/${teamId}/rules/${ruleId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      console.error("Failed to delete rule")
      return
    }

    setTeamRules((prev) => prev.filter((rule) => rule.id !== ruleId))
  }

  const handleEditRule = async (updatedRule: {
    id: number;
    name: string;
    description: string;
    amount: number;
  }) => {
    const res = await fetch(`/api/teams/${teamId}/rules/${updatedRule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRule),
    })

    if (!res.ok) {
      console.error("Failed to update rule")
      return
    }

    const result = await res.json()
    setTeamRules((prev) =>
      prev.map((r) => (r.id === result.id ? result : r))
    )
  }

  const resetRuleForm = () => {
    setNewRuleName("")
    setNewRuleDescription("")
    setNewRuleAmount("")
  }

  const handleAddRuleBreak = () => {
    // Validate form
    if (!newBreakRuleId || !newBreakUserId) {
      return
    }

    // In a real app, this would call an API
    const newBreak = {
      id: ruleBreaks.length + 1,
      teamId: teamId,
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
      teamId: teamId,
      userId: Number.parseInt(newPaymentUserId),
      amount: Number.parseFloat(newPaymentAmount),
      description: newPaymentDescription,
      date: new Date().toISOString(),
    }

    // Update local state
    setTeamPayments([...teamPayments, newPayment])

    // Update current pool amount
    const paymentAmount = Number.parseFloat(newPaymentAmount)
    setCurrentPoolAmount(currentPoolAmount + paymentAmount)
    setAvailablePoolAmount(availablePoolAmount + paymentAmount)

    // Reset form
    setNewPaymentUserId("")
    setNewPaymentAmount("")
    setNewPaymentDescription("")
    setShowNewPaymentDialog(false)
  }

  const handleAddExpense = () => {
    // Validate form
    if (!newExpenseAmount || !newExpenseDescription) {
      return
    }

    // Check if there's enough money in the pool
    const expenseAmount = Number.parseFloat(newExpenseAmount)
    if (expenseAmount > availablePoolAmount) {
      alert("Not enough money in the pool for this expense!")
      return
    }

    // In a real app, this would call an API
    const newExpense = {
      id: expenses.length + 1,
      teamId: teamId,
      amount: expenseAmount,
      description: newExpenseDescription,
      date: new Date().toISOString(),
    }

    // Update local state
    setTeamExpenses([...teamExpenses, newExpense])

    // Update available pool amount
    setAvailablePoolAmount(availablePoolAmount - expenseAmount)

    // Reset form
    setNewExpenseAmount("")
    setNewExpenseDescription("")
    setShowNewExpenseDialog(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackToTeam}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to team</span>
          </Button>
          <h1 className="text-xl font-bold">{team?.name} - Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {
        loading && (
          <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
          </div>
        )
      }

      {
        (!loading && !team) && (
          <div className="flex items-center justify-center min-h-screen">
            <p>Team not found.</p>
          </div>
        )
      }

      {
        (!loading && team && !isMember) && (
          <div className="flex items-center justify-center min-h-screen">
            <p>You are not a member of this team.</p>
          </div>
        )
      }

      {
        (!loading && team && isMember && !isAdmin) && (
          <div className="flex items-center justify-center min-h-screen">
            <p>You are not an admin of this team.</p>
          </div>
        )
      }

      {
        (!loading && team && isMember && isAdmin) && (
          <main className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <p className="text-muted-foreground">Manage rules, track rule breaks, and record payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expected Pool</CardTitle>
                  <CardDescription>Total amount from rule breaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">€{totalPoolAmount.toFixed(2)}</div>
                  <p className="text-muted-foreground">
                    {currentPoolAmount < totalPoolAmount
                      ? `€${(totalPoolAmount - currentPoolAmount).toFixed(2)} still to be collected`
                      : "All debts have been paid"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collected Pool</CardTitle>
                  <CardDescription>Total amount collected</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">€{currentPoolAmount.toFixed(2)}</div>
                  <p className="text-muted-foreground">
                    {((currentPoolAmount / totalPoolAmount) * 100).toFixed(0)}% of expected amount
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Pool</CardTitle>
                  <CardDescription>Amount after expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">€{availablePoolAmount.toFixed(2)}</div>
                  <p className="text-muted-foreground">
                    {teamExpenses.length > 0
                      ? `€${(currentPoolAmount - availablePoolAmount).toFixed(2)} spent on expenses`
                      : "No expenses recorded yet"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
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

            <Tabs defaultValue="rules">
              <TabsList className="mb-4">
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="breaks">Rule Breaks</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>

              <TabsContent value="rules">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Team Rules</h3>
                  <Dialog open={showRuleDialog} onOpenChange={(open) => {
                    if (!open) {
                      setEditingRule(null) // reset on close
                      resetRuleForm()
                    }
                    setShowRuleDialog(open)
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setShowRuleDialog(true)} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                        <Plus className="h-4 w-4 mr-2" /> Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRule ? "Update Rule" : "Add New Rule"}</DialogTitle>
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
                        <Button variant="outline" onClick={() => {resetRuleForm(); setEditingRule(null); setShowRuleDialog(false)}}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRule} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                          {editingRule ? "Update Rule" : "Add Rule"}
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
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-[#255F38] text-white">
                                €{rule.amount}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="cursor-pointer text-white"
                                onClick={() => {
                                  setEditingRule(rule)
                                  setShowRuleDialog(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Badge>
                              <Badge
                                variant="outline"
                                className="cursor-pointer text-red-500"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Badge>
                            </div>
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
                                  {rule.name} (€{rule.amount})
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

              <TabsContent value="expenses">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Team Expenses</h3>
                  <Dialog open={showNewExpenseDialog} onOpenChange={setShowNewExpenseDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#255F38] hover:bg-[#1d4a2c]">
                        <ShoppingBag className="h-4 w-4 mr-2" /> Record Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Team Expense</DialogTitle>
                        <DialogDescription>Record when money from the team pool is spent on something.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="expense-amount">Amount (€)</Label>
                          <Input
                            id="expense-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="15.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expense-description">Description</Label>
                          <Textarea
                            id="expense-description"
                            value={newExpenseDescription}
                            onChange={(e) => setNewExpenseDescription(e.target.value)}
                            placeholder="What was purchased for the team..."
                            required
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Available pool amount: €{availablePoolAmount.toFixed(2)}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewExpenseDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddExpense}
                          className="bg-[#255F38] hover:bg-[#1d4a2c]"
                          disabled={
                            !newExpenseAmount || !newExpenseDescription || Number(newExpenseAmount) > availablePoolAmount
                          }
                        >
                          Record Expense
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {teamExpenses.length === 0 ? (
                  <p>No expenses have been recorded for this team.</p>
                ) : (
                  <div className="space-y-4">
                    {teamExpenses.map((expense) => (
                      <Card key={expense.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Team Expense</CardTitle>
                            <Badge variant="outline" className="bg-[#255F38] text-white">
                              €{expense.amount.toFixed(2)}
                            </Badge>
                          </div>
                          <CardDescription>Date: {new Date(expense.date).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        )
      }
    </div>
  )
}
