import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack";
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function generateJoinCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  const user = await stackServerApp.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT
        t.id,
        t.name,
        t.description,
        (SELECT COUNT(*) FROM team_members tm2 WHERE tm2.team_id = t.id) AS "memberCount",
        COUNT(DISTINCT r.id) AS "ruleCount"
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN rules r ON t.id = r.team_id
      WHERE tm.user_id = $1
      GROUP BY t.id
    `, [user.id])

    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, description } = await req.json()
  if (!name)
    return NextResponse.json({ error: "Missing team name" }, { status: 400 })

  const client = await pool.connect()
  try {
    const check = await client.query(
      `SELECT COUNT(*) FROM team_members WHERE user_id = $1 AND role = 'owner'`,
      [user.id]
    )
    if (parseInt(check.rows[0].count) >= 1) {
      return NextResponse.json(
        { error: "You can only create one team." },
        { status: 403 }
      )
    }

    const joinCode = generateJoinCode()

    const result = await client.query(
      `INSERT INTO teams (name, description, join_code, join_enabled)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [name, description ?? "", joinCode]
    )

    await client.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [result.rows[0].id, user.id]
    )

    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}