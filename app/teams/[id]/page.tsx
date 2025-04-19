"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { expenses } from "@/data/expenses"
import { payments } from "@/data/payments"
import { ruleBreaks } from "@/data/rule-breaks"
import { rules } from "@/data/rules"
import { teams } from "@/data/teams"
import { users } from "@/data/users"

export default function TeamDetailsPage({ params }: any) {
  const { id } = use(params);
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [teamRules, setTeamRules] = useState([])
  const [teamRuleBreaks, setTeamRuleBreaks] = useState([])
  const [teamPayments, setTeamPayments] = useState([])
  const [teamExpenses, setTeamExpenses] = useState([])
  const [userDebt, setUserDebt] = useState(0)
  const [totalPoolAmount, setTotalPoolAmount] = useState(0)
  const [currentPoolAmount, setCurrentPoolAmount] = useState(0)
  const [availablePoolAmount, setAvailablePoolAmount] = useState(0)
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
    const teamData = teams.find((t) => t.id === Number.parseInt(id))
    if (!teamData) {
      router.push("/teams")
      return
    }
    setTeam(teamData)

    // Get team rules
    const filteredRules = rules.filter((rule) => rule.teamId === teamData.id)
    setTeamRules(filteredRules)

    // Get team rule breaks
    const filteredRuleBreaks = ruleBreaks.filter((rb) => rb.teamId === teamData.id)
    setTeamRuleBreaks(filteredRuleBreaks)

    // Get team payments
    const filteredPayments = payments.filter((payment) => payment.teamId === teamData.id)
    setTeamPayments(filteredPayments)

    // Get team expenses
    const filteredExpenses = expenses.filter((expense) => expense.teamId === teamData.id)
    setTeamExpenses(filteredExpenses)

    // Calculate user debt
    const currentUser = users.find((u) => u.username === userData.username)
    if (currentUser) {
      const userBreaks = filteredRuleBreaks.filter((rb) => rb.userId === currentUser.id)
      const userBreakTotal = userBreaks.reduce((total, rb) => {
        const ruleAmount = filteredRules.find((r) => r.id === rb.ruleId)?.amount || 0
        return total + ruleAmount
      }, 0)

      const userPayments = filteredPayments.filter((p) => p.userId === currentUser.id)
      const userPaymentTotal = userPayments.reduce((total, p) => total + p.amount, 0)

      setUserDebt(userBreakTotal - userPaymentTotal)
    }

    // Calculate pool amounts
    const totalBreakAmount = filteredRuleBreaks.reduce((total, rb) => {
      const ruleAmount = filteredRules.find((r) => r.id === rb.ruleId)?.amount || 0
      return total + ruleAmount
    }, 0)

    const totalPaymentAmount = filteredPayments.reduce((total, p) => total + p.amount, 0)
    const totalExpenseAmount = filteredExpenses.reduce((total, e) => total + e.amount, 0)

    setTotalPoolAmount(totalBreakAmount)
    setCurrentPoolAmount(totalPaymentAmount)
    setAvailablePoolAmount(totalPaymentAmount - totalExpenseAmount)
  }, [id, router])

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  }

  const handleBackToTeams = () => {
    router.push("/");
  }

  const handleAdminDashboard = () => {
    router.push(`/teams/${id}/admin`);
  }

  if (!user || !team) {
    return null
  }

  const isAdmin = user.role === "admin" || team.adminIds.includes(users.find((u) => u.username === user.username)?.id)

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackToTeams}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to teams</span>
          </Button>
          <h1 className="text-xl font-bold">{team.name}</h1>
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
              <div className="text-3xl font-bold">€{userDebt.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Money Pool</CardTitle>
              <CardDescription>Current vs expected amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span>Current: €{availablePoolAmount.toFixed(2)}</span>
                <span>Expected: €{totalPoolAmount.toFixed(2)}</span>
              </div>
              <Progress value={(currentPoolAmount / totalPoolAmount) * 100} className="h-2" />
              {teamExpenses.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  €{(currentPoolAmount - availablePoolAmount).toFixed(2)} spent on team expenses
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
                    const rule = teamRules.find((r) => r.id === ruleBreak.ruleId)
                    const userWhoBreak = users.find((u) => u.id === ruleBreak.userId)
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
                    const userWhoPaid = users.find((u) => u.id === payment.userId)
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
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
