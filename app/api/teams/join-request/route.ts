import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { joinCode } = await req.json()
  if (!joinCode || typeof joinCode !== "string" || joinCode.length !== 8) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    // 1. Find the team by join code
    const teamRes = await client.query(
      `SELECT id, join_enabled FROM teams WHERE join_code = $1`,
      [joinCode.toUpperCase()]
    )
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 404 })
    }
    const team = teamRes.rows[0]
    if (!team.join_enabled) {
      return NextResponse.json({ error: "Joining this team is currently disabled" }, { status: 403 })
    }

    // 2. Check if user is already a member
    const memberRes = await client.query(
      `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [team.id, user.id]
    )
    if (memberRes.rows.length > 0) {
      return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 })
    }

    // 3. Check if user already has a pending join request
    const requestRes = await client.query(
      `SELECT 1 FROM team_join_requests WHERE team_id = $1 AND user_id = $2 AND approved IS NULL AND rejected IS NULL`,
      [team.id, user.id]
    )
    if (requestRes.rows.length > 0) {
      return NextResponse.json({ error: "You already have a pending join request for this team" }, { status: 400 })
    }

    // 4. Check if team is full (30 members)
    const countRes = await client.query(
      `SELECT COUNT(*) FROM team_members WHERE team_id = $1`,
      [team.id]
    )
    if (parseInt(countRes.rows[0].count) >= 30) {
      return NextResponse.json({ error: "This team is full" }, { status: 400 })
    }

    // 5. Create join request
    const insertRes = await client.query(
      `INSERT INTO team_join_requests (team_id, user_id, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [team.id, user.id]
    )

    return NextResponse.json({ success: true, request: insertRes.rows[0] })
  } finally {
    client.release()
  }
}