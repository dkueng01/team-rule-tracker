"use client"
import { useUser } from "@stackframe/stack";

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeamDetailsPage({ params }: { params: Promise<{ teamId: string }> }) {
  useUser({ or: 'redirect' });
  const user = useUser();
  const { teamId } = use(params);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [team, setTeam] = useState<any>(null)
  const [teamRules, setTeamRules] = useState<any[]>([])
  const [teamRuleBreaks, setTeamRuleBreaks] = useState<any[]>([])
  const [teamPayments, setTeamPayments] = useState<any[]>([])
  const [teamExpenses, setTeamExpenses] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [userDebt, setUserDebt] = useState(0)
  const [totalPoolAmount, setTotalPoolAmount] = useState(0)
  const [currentPoolAmount, setCurrentPoolAmount] = useState(0)
  const [availablePoolAmount, setAvailablePoolAmount] = useState(0)
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

      // Calculate user debt
      const userBreaks = data.ruleBreaks.filter((rb: any) => rb.user_id === user?.id)
      const userBreakTotal = userBreaks.reduce((total: number, rb: any) => {
        const ruleAmount = data.rules.find((r: any) => r.id === rb.rule_id)?.amount || 0
        return total + ruleAmount
      }, 0)

      const userPayments = data.payments.filter((p: any) => p.user_id === user?.id)
      const userPaymentTotal = userPayments.reduce((total: number, p: any) => total + p.amount, 0)

      setUserDebt(userBreakTotal - userPaymentTotal)

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

  const handleLogout = () => {
    user?.signOut();
    router.push("/");
  }

  const handleBackToTeams = () => {
    router.push("/");
  }

  const handleAdminDashboard = () => {
    router.push(`/teams/${teamId}/admin`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackToTeams}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to teams</span>
          </Button>
          <h1 className="text-xl font-bold">{team?.name}</h1>
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
        (!loading && team && isMember) && (
          <main className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">{team.name}</h2>
                <p className="text-muted-foreground">{team.description}</p>
              </div>

              {isAdmin && (
                <Button onClick={handleAdminDashboard} className="bg-[#255F38] hover:bg-[#1d4a2c]">
                  Admin Dashboard
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Debt</CardTitle>
                  <CardDescription>Amount you owe to the team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€{userDebt}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Money Pool</CardTitle>
                  <CardDescription>Current vs expected amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-2">
                    <span>Current: €{availablePoolAmount}</span>
                    <span>Expected: €{totalPoolAmount}</span>
                  </div>
                  <Progress value={(currentPoolAmount / totalPoolAmount) * 100} className="h-2" />
                  {teamExpenses.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      €{(currentPoolAmount - availablePoolAmount)} spent on team expenses
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="rules">
              <TabsList className="mb-4">
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="breaks">Rule Breaks</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
              </TabsList>

              <TabsContent value="rules">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Team Rules</h3>
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
                                €{rule.amount}
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
                </div>
              </TabsContent>

              <TabsContent value="breaks">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Rule Breaks</h3>
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
                                <Badge variant="outline" className="bg-[#255F38] text-white">
                                  €{rule?.amount}
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
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Payments</h3>
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
                                <Badge variant="outline" className="bg-[#255F38] text-white">
                                  €{payment.amount}
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
                </div>
              </TabsContent>

              <TabsContent value="expenses">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Team Expenses</h3>
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
                                €{expense.amount}
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
                </div>
              </TabsContent>
            </Tabs>
          </main>
        )
      }
    </div>
  )
}
