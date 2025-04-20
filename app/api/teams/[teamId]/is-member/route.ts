import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { stackServerApp } from "@/stack";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
    const user = await stackServerApp.getUser();

  if (!user?.id) {
    return NextResponse.json({ isMember: false, error: "Unauthorized" }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    const teamId = parseInt(params.teamId)
    const result = await client.query(
      `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1`,
      [teamId, user.id]
    )

    const isMember = (result.rowCount ?? 0) > 0;
    return NextResponse.json({ isMember })
  } finally {
    client.release()
  }
}
