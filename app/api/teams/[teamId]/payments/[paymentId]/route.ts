import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function PUT(req: NextRequest, { params }: { params: { teamId: string; paymentId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const paymentId = parseInt(params.paymentId)
  const { userId, amount, description } = await req.json()

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
      `UPDATE payments
       SET user_id = $1, amount = $2, description = $3
       WHERE id = $4 AND team_id = $5
       RETURNING *`,
      [userId, amount, description || "", paymentId, teamId]
    )

    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { teamId: string; paymentId: string } }) {
  const user = await stackServerApp.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teamId = parseInt(params.teamId)
  const paymentId = parseInt(params.paymentId)

  const client = await pool.connect()
  try {
    const membership = await client.query(
      `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    )
    if (membership.rows.length === 0 || !membership.rows[0].is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await client.query(
      `DELETE FROM payments WHERE id = $1 AND team_id = $2`,
      [paymentId, teamId]
    )

    return NextResponse.json({ success: true })
  } finally {
    client.release()
  }
}