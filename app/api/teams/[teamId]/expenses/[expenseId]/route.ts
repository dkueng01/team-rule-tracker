// PUT + DELETE - Update/Delete Expense
import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function PUT(req: NextRequest, { params }: { params: { teamId: string, expenseId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const expenseId = parseInt(params.expenseId)
  const { amount, description } = await req.json()

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )
    const role = result.rows[0]?.role
    if (result.rows.length === 0 || !(role === "admin" || role === "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const update = await client.query(
      `UPDATE expenses SET amount = $1, description = $2 WHERE id = $3 AND team_id = $4 RETURNING *`,
      [amount, description, expenseId, teamId]
    )

    return NextResponse.json(update.rows[0])
  } finally {
    client.release()
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { teamId: string, expenseId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const expenseId = parseInt(params.expenseId)

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )
    const role = result.rows[0]?.role
    if (result.rows.length === 0 || !(role === "admin" || role === "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await client.query(`DELETE FROM expenses WHERE id = $1 AND team_id = $2`, [expenseId, teamId])

    return NextResponse.json({ success: true })
  } finally {
    client.release()
  }
}