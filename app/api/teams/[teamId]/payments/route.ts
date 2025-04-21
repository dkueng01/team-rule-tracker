import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const body = await req.json()
  const { userId, amount, description } = body

  if (!userId || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const membership = await client.query(
      `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )

    if (membership.rows.length === 0 || !membership.rows[0].is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await client.query(
      `INSERT INTO payments (team_id, user_id, amount, description, date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [teamId, userId, amount, description || ""]
    )

    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}