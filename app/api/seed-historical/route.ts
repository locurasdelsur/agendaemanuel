import { NextResponse } from "next/server"
import historicalData from "@/scripts/historical-data.json"

export async function GET() {
  return NextResponse.json(historicalData)
}
