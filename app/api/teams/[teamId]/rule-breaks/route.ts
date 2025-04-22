import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const { ruleId, userId, description } = await req.json()

  if (!ruleId || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const membership = await client.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )

    const role = membership.rows[0]?.role
    if (membership.rows.length === 0 || !(role === "admin" || role === "owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await client.query(
      `INSERT INTO rule_breaks (team_id, rule_id, user_id, description, date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [teamId, ruleId, userId, description ?? ""]
    )

    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}