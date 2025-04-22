import { NextRequest, NextResponse } from "next/server"
import { Pool, QueryResult } from "pg"
import { stackServerApp } from "@/stack";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
    const user = await stackServerApp.getUser();
    const teamId = parseInt(params.teamId)

    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()

    try {
        // First: check membership
        const membershipResult = await client.query(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, user.id]
        )

        if (membershipResult.rows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const role = membershipResult.rows[0].role;
        const isAdmin = role === "admin" || role === "owner";

        // Then: fetch team
        const team = await client.query(
        `SELECT id, name, description, join_code, join_enabled FROM teams WHERE id = $1`,
        [teamId]
        )

        if (team.rows.length === 0) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
        }

        // Then: fetch related data
        const promises = [
            client.query(`SELECT * FROM rules WHERE team_id = $1`, [teamId]),
            client.query(`SELECT * FROM rule_breaks WHERE team_id = $1`, [teamId]),
            client.query(`SELECT * FROM payments WHERE team_id = $1`, [teamId]),
            client.query(`SELECT * FROM expenses WHERE team_id = $1`, [teamId]),
            client.query(`SELECT tm.user_id AS id, u.name, u.email FROM team_members tm JOIN neon_auth.users_sync u ON tm.user_id = u.id WHERE tm.team_id = $1`, [teamId]),
            client.query(`SELECT jr.id, jr.user_id, u.name, u.email AS user_name, jr.created_at FROM team_join_requests jr LEFT JOIN neon_auth.users_sync u ON jr.user_id = u.id WHERE jr.team_id = $1 AND jr.approved IS NULL AND jr.rejected IS NULL ORDER BY jr.created_at ASC`, [teamId])
        ]

        const results = await Promise.all(promises)

        const rules: QueryResult = results[0]
        const ruleBreaks: QueryResult = results[1]
        const payments: QueryResult = results[2]
        const expenses: QueryResult = results[3]
        const teamMembers: QueryResult = results[4] ?? { rows: [] }
        const joinRequests: QueryResult = results[5] ?? { rows: [] }

        return NextResponse.json({
            team: team.rows[0],
            isAdmin,
            role,
            rules: rules.rows,
            ruleBreaks: ruleBreaks.rows,
            payments: payments.rows,
            expenses: expenses.rows,
            teamMembers: teamMembers.rows,
            joinRequests: joinRequests.rows
        })
    } finally {
        client.release()
    }
}
