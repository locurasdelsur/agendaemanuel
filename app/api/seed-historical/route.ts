import { NextRequest, NextResponse } from "next/server"
import historicalData from "@/scripts/historical-data.json"

export async function GET() {
  return NextResponse.json(historicalData)
}

/**
 * DELETE /api/seed-historical?id=<historyId>
 * Returns the filtered list without the deleted entry so the client
 * can update its local state. The JSON file itself is read-only at
 * runtime (it lives in the bundle), so deletions are client-side only
 * unless the GAS sheet delete is called via /api/proxy.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ success: false, error: "id es requerido" }, { status: 400 })
  }
  // The actual deletion happens client-side (the history array is managed in
  // component state). We just confirm success so the UI can remove the entry.
  return NextResponse.json({ success: true, deletedId: id })
}
