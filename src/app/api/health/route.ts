// src/app/api/health/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs" // Prismaはedge不可

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      status: 204,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Health check failed:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}

export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { headers: { "Cache-Control": "no-store" }, status: 204 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
