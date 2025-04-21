// POST - Create Expense
import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const { amount, description } = await req.json()

  if (!amount || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const insert = await client.query(
      `INSERT INTO expenses (team_id, amount, description, date)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [teamId, amount, description]
    )

    return NextResponse.json(insert.rows[0])
  } finally {
    client.release()
  }
}