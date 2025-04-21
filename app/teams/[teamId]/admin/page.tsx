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
  const [showRuleBreakDialog, setShowRuleBreakDialog] = useState(false)
  const [editingRuleBreak, setEditingRuleBreak] = useState<any | null>(null)


  // New payment form
  const [newPaymentUserId, setNewPaymentUserId] = useState("")
  const [newPaymentAmount, setNewPaymentAmount] = useState("")
  const [newPaymentDescription, setNewPaymentDescription] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any | null>(null)

  // New expense form
  const [newExpenseAmount, setNewExpenseAmount] = useState("")
  const [newExpenseDescription, setNewExpenseDescription] = useState("")
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)

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
        return total + Number(ruleAmount)
      }, 0)

      const totalPaymentAmount = data.payments.reduce((total: number, p: any) => total + Number(p.amount), 0)
      const totalExpenseAmount = data.expenses.reduce((total: number, e: any) => total + Number(e.amount), 0)

      setTotalPoolAmount(totalBreakAmount - totalExpenseAmount)
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

  useEffect(() => {
    if (editingRuleBreak) {
      setNewBreakRuleId(editingRuleBreak.rule_id.toString())
      setNewBreakUserId(editingRuleBreak.user_id)
      setNewBreakDescription(editingRuleBreak.description || "")
    }
  }, [editingRuleBreak])

  useEffect(() => {
    if (editingPayment) {
      setNewPaymentUserId(editingPayment.user_id.toString())
      setNewPaymentAmount(editingPayment.amount.toString())
      setNewPaymentDescription(editingPayment.description || "")
    }
  }, [editingPayment])

  useEffect(() => {
    if (editingExpense) {
      setNewExpenseAmount(editingExpense.amount.toString())
      setNewExpenseDescription(editingExpense.description)
    }
  }, [editingExpense])

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

  const resetRuleForm = () => {
    setNewRuleName("")
    setNewRuleDescription("")
    setNewRuleAmount("")
  }

  const handleSaveRuleBreak = async () => {
    if (!newBreakRuleId || !newBreakUserId) return

    const payload = {
      ruleId: parseInt(newBreakRuleId),
      userId: newBreakUserId,
      description: newBreakDescription,
    }

    const method = editingRuleBreak ? "PUT" : "POST"
    const url = editingRuleBreak
      ? `/api/teams/${teamId}/rule-breaks/${editingRuleBreak.id}`
      : `/api/teams/${teamId}/rule-breaks`

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error("Failed to save rule break")
      return
    }

    const breakData = await res.json()

    setTeamRuleBreaks((prev) =>
      editingRuleBreak
        ? prev.map((b) => (b.id === breakData.id ? breakData : b))
        : [...prev, breakData]
    )

    setShowRuleBreakDialog(false)
    resetRuleBreakForm()
    setEditingRuleBreak(null)
  }

  const handleDeleteRuleBreak = async (breakId: number) => {
    const confirmDelete = confirm("Delete this rule break?")
    if (!confirmDelete) return

    const res = await fetch(`/api/teams/${teamId}/rule-breaks/${breakId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      console.error("Failed to delete rule break")
      return
    }

    setTeamRuleBreaks((prev) => prev.filter((rb) => rb.id !== breakId))
  }

  const resetRuleBreakForm = () => {
    setNewBreakRuleId("")
    setNewBreakUserId("")
    setNewBreakDescription("")
  }

  const handleSavePayment = async () => {
    if (!newPaymentUserId || !newPaymentAmount) return

    const payload = {
      userId: newPaymentUserId,
      amount: parseFloat(newPaymentAmount),
      description: newPaymentDescription,
    }

    const url = editingPayment
      ? `/api/teams/${teamId}/payments/${editingPayment.id}`
      : `/api/teams/${teamId}/payments`

    const method = editingPayment ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error("Failed to save payment")
      return
    }

    const savedPayment = await res.json()

    setTeamPayments((prev) =>
      editingPayment
        ? prev.map((p) => (p.id === savedPayment.id ? savedPayment : p))
        : [...prev, savedPayment]
    )

    const amountDiff = editingPayment
      ? savedPayment.amount - editingPayment.amount
      : savedPayment.amount

    setCurrentPoolAmount(currentPoolAmount + amountDiff)
    setAvailablePoolAmount(availablePoolAmount + amountDiff)

    setEditingPayment(null)
    setShowPaymentDialog(false)
    resetPaymentForm()
  }

  const handleDeletePayment = async (paymentId: number) => {
    const confirmDelete = confirm("Delete this payment?")
    if (!confirmDelete) return

    const res = await fetch(`/api/teams/${teamId}/payments/${paymentId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      console.error("Failed to delete payment")
      return
    }

    const deletedPayment = teamPayments.find(p => p.id === paymentId)
    if (deletedPayment) {
      setCurrentPoolAmount(currentPoolAmount - deletedPayment.amount)
      setAvailablePoolAmount(availablePoolAmount - deletedPayment.amount)
    }

    setTeamPayments((prev) => prev.filter((p) => p.id !== paymentId))
  }

  const resetPaymentForm = () => {
    setNewPaymentUserId("")
    setNewPaymentAmount("")
    setNewPaymentDescription("")
  }

  const handleSaveExpense = async () => {
    if (!newExpenseAmount || !newExpenseDescription) return

    const payload = {
      amount: parseFloat(newExpenseAmount),
      description: newExpenseDescription,
    }

    const url = editingExpense
      ? `/api/teams/${teamId}/expenses/${editingExpense.id}`
      : `/api/teams/${teamId}/expenses`

    const method = editingExpense ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error("Failed to save expense")
      return
    }

    const result = await res.json()

    setTeamExpenses((prev) =>
      editingExpense
        ? prev.map((e) => (e.id === result.id ? result : e))
        : [...prev, result]
    )

    const amountDiff = editingExpense
      ? result.amount - editingExpense.amount
      : result.amount

    setAvailablePoolAmount(availablePoolAmount - amountDiff)

    setShowExpenseDialog(false)
    setEditingExpense(null)
    resetExpenseForm()
  }

  const handleDeleteExpense = async (expenseId: number) => {
    const confirmDelete = confirm("Delete this expense?")
    if (!confirmDelete) return

    const res = await fetch(`/api/teams/${teamId}/expenses/${expenseId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      console.error("Failed to delete expense")
      return
    }

    const deleted = teamExpenses.find((e) => e.id === expenseId)
    if (deleted) {
      setAvailablePoolAmount(availablePoolAmount + deleted.amount)
    }

    setTeamExpenses((prev) => prev.filter((e) => e.id !== expenseId))
  }

  const resetExpenseForm = () => {
    setNewExpenseAmount("")
    setNewExpenseDescription("")
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
                  <div className="text-2xl font-bold mb-2">€{totalPoolAmount}</div>
                  <p className="text-muted-foreground">
                    {currentPoolAmount < totalPoolAmount
                      ? `€${(totalPoolAmount - currentPoolAmount)} still to be collected`
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
                  <div className="text-2xl font-bold mb-2">€{currentPoolAmount}</div>
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
                  <div className="text-2xl font-bold mb-2">€{availablePoolAmount}</div>
                  <p className="text-muted-foreground">
                    {teamExpenses.length > 0
                      ? `€${(currentPoolAmount - availablePoolAmount)} spent on expenses`
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
                          <div className="flex justify-between items-start">
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
                  <Dialog
                    open={showRuleBreakDialog}
                    onOpenChange={(open) => {
                      if (!open) {
                        resetRuleBreakForm()
                        setEditingRuleBreak(null)
                      }
                      setShowRuleBreakDialog(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingRuleBreak(null)
                          setShowRuleBreakDialog(true)
                        }}
                        className="bg-[#255F38] hover:bg-[#1d4a2c]"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Record Rule Break
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRuleBreak ? "Edit Rule Break" : "Record Rule Break"}</DialogTitle>
                        <DialogDescription>
                          {editingRuleBreak ? "Update the details of this rule break." : "Record a new rule break for this team member."}
                        </DialogDescription>
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
                        <Button variant="outline" onClick={() => {resetRuleBreakForm(); setEditingRuleBreak(null); setShowRuleBreakDialog(false)}}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRuleBreak} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                          {editingRuleBreak ? "Update Break" : "Record Break"}
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
                      const rule = teamRules.find((r) => r.id === ruleBreak.rule_id)
                      const userWhoBreak = teamMembers.find((u) => u.id === ruleBreak.user_id)

                      return (
                        <Card key={ruleBreak.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{rule?.name}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-[#255F38] text-white">
                                  €{rule?.amount}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer text-white"
                                  onClick={() => {
                                    setEditingRuleBreak(ruleBreak)
                                    setShowRuleBreakDialog(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer text-red-500"
                                  onClick={() => handleDeleteRuleBreak(ruleBreak.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Badge>
                              </div>
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
                  <Dialog
                    open={showPaymentDialog}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingPayment(null)
                        resetPaymentForm()
                      }
                      setShowPaymentDialog(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingPayment(null)
                          setShowPaymentDialog(true)
                        }}
                        className="bg-[#255F38] hover:bg-[#1d4a2c]"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingPayment ? "Edit Payment" : "Record Payment"}</DialogTitle>
                        <DialogDescription>
                          {editingPayment
                            ? "Update this team member’s payment."
                            : "Record a new payment for a rule break."}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Team Member</Label>
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
                          <Label>Amount (€)</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newPaymentAmount}
                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                            placeholder="e.g. 10.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={newPaymentDescription}
                            onChange={(e) => setNewPaymentDescription(e.target.value)}
                            placeholder="Add a note about this payment..."
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowPaymentDialog(false); setEditingPayment(null); resetPaymentForm(); }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSavePayment} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                          {editingPayment ? "Update Payment" : "Record Payment"}
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
                      const userWhoPaid = teamMembers.find((u) => u.id === payment.user_id)
                      return (
                        <Card key={payment.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">Payment</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-[#255F38] text-white">
                                  €{payment.amount}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer text-white"
                                  onClick={() => {
                                    setEditingPayment(payment)
                                    setShowPaymentDialog(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer text-red-500"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Badge>
                              </div>
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
                  <Dialog
                    open={showExpenseDialog}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingExpense(null)
                        resetExpenseForm()
                      }
                      setShowExpenseDialog(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingExpense(null)
                          setShowExpenseDialog(true)
                        }}
                        className="bg-[#255F38] hover:bg-[#1d4a2c]"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" /> Record Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingExpense ? "Edit Expense" : "Record Expense"}</DialogTitle>
                        <DialogDescription>
                          {editingExpense ? "Update the team expense details." : "Add a new team expense."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Amount (€)</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="15.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newExpenseDescription}
                            onChange={(e) => setNewExpenseDescription(e.target.value)}
                            placeholder="What was purchased..."
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Available pool: €{availablePoolAmount}</p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowExpenseDialog(false); setEditingExpense(null); resetExpenseForm(); }}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveExpense}
                          className="bg-[#255F38] hover:bg-[#1d4a2c]"
                          disabled={
                            !newExpenseAmount || !newExpenseDescription || parseFloat(newExpenseAmount) > availablePoolAmount
                          }
                        >
                          {editingExpense ? "Update Expense" : "Record Expense"}
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
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="bg-[#255F38] text-white">
                                €{expense.amount}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="cursor-pointer text-white"
                                onClick={() => {
                                  setEditingExpense(expense)
                                  setShowExpenseDialog(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Badge>
                              <Badge
                                variant="outline"
                                className="cursor-pointer text-red-500"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Badge>
                            </div>
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
