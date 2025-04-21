import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string; breakId: string } }
) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const breakId = parseInt(params.breakId)
  const { ruleId, userId, description } = await req.json()

  const client = await pool.connect()
  try {
    // Check admin status
    const membership = await client.query(
      `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )

    if (membership.rows.length === 0 || !membership.rows[0].is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const update = await client.query(
      `UPDATE rule_breaks
       SET rule_id = $1, user_id = $2, description = $3
       WHERE id = $4 AND team_id = $5
       RETURNING *`,
      [ruleId, userId, description ?? "", breakId, teamId]
    )

    if (update.rows.length === 0) {
      return NextResponse.json({ error: "Rule break not found" }, { status: 404 })
    }

    return NextResponse.json(update.rows[0])
  } finally {
    client.release()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { teamId: string; breakId: string } }
) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const breakId = parseInt(params.breakId)

  const client = await pool.connect()
  try {
    // Check admin status
    const membership = await client.query(
      `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )

    if (membership.rows.length === 0 || !membership.rows[0].is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const deletion = await client.query(
      `DELETE FROM rule_breaks
       WHERE id = $1 AND team_id = $2
       RETURNING *`,
      [breakId, teamId]
    )

    if (deletion.rows.length === 0) {
      return NextResponse.json({ error: "Rule break not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } finally {
    client.release()
  }
}
