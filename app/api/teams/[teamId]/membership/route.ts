import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { stackServerApp } from "@/stack";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const user = await stackServerApp.getUser();

  if (!user?.id) {
    return NextResponse.json(
      { isMember: false, isAdmin: false },
      { status: 401 }
    );
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1`,
      [parseInt(params.teamId), user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ isMember: false, isAdmin: false });
    }

    const role = result.rows[0].role;
    const isAdmin = role === "admin" || role === "owner";

    return NextResponse.json({ isMember: true, isAdmin });
  } finally {
    client.release();
  }
}