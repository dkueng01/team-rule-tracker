import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const user = await stackServerApp.getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = parseInt(params.teamId);
  const { join_enabled } = await req.json();

  if (typeof join_enabled !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid join_enabled" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    // Only allow admin/owner
    const membership = await client.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, user.id]
    );
    const role = membership.rows[0]?.role;
    if (
      membership.rows.length === 0 ||
      !(role === "admin" || role === "owner")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await client.query(
      `UPDATE teams SET join_enabled = $1 WHERE id = $2`,
      [join_enabled, teamId]
    );

    return NextResponse.json({ join_enabled });
  } finally {
    client.release();
  }
}