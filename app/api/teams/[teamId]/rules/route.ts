import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack";
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
    const user = await stackServerApp.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const teamId = parseInt(params.teamId)
    const body = await req.json()
    const { name, description, amount } = body

    if (!name || !amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        // Ensure user is an admin
        const membership = await client.query(
            `SELECT is_admin FROM team_members WHERE team_id = $1 AND user_id = $2`,
            [teamId, user.id]
        )
        if (membership.rows.length === 0 || !membership.rows[0].is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Insert new rule
        const result = await client.query(
            `INSERT INTO rules (team_id, name, description, amount, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *`,
            [teamId, name, description ?? "", amount]
        )

        return NextResponse.json(result.rows[0])
    } finally {
        client.release()
    }
}