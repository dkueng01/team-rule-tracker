import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function generateJoinCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const user = await stackServerApp.getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = parseInt(params.teamId);

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

    // Generate and update join code
    const newCode = generateJoinCode();
    await client.query(
      `UPDATE teams SET join_code = $1 WHERE id = $2`,
      [newCode, teamId]
    );

    return NextResponse.json({ join_code: newCode });
  } finally {
    client.release();
  }
}