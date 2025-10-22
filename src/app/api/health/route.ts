import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * Health check endpoint to prevent Supabase free tier from pausing
 * This endpoint performs a lightweight database query to keep the connection alive
 */
export async function GET() {
  try {
    // Perform a lightweight query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        message: "Health check successful",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        message: "Health check failed",
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
