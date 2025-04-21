import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack";
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

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
