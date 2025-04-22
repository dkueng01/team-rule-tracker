import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack";
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string; ruleId: string } }
) {
  const user = await stackServerApp.getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const ruleId = parseInt(params.ruleId)
  const { name, description, amount } = await req.json()

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
      `UPDATE rules SET name = $1, description = $2, amount = $3
       WHERE id = $4 AND team_id = $5
       RETURNING *`,
      [name, description ?? "", amount, ruleId, teamId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { teamId: string; ruleId: string } }
) {
  const user = await stackServerApp.getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const ruleId = parseInt(params.ruleId)

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

    const deleted = await client.query(
      `DELETE FROM rules WHERE id = $1 AND team_id = $2 RETURNING *`,
      [ruleId, teamId]
    )

    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } finally {
    client.release()
  }
}