import { NextRequest, NextResponse } from "next/server"

// Single source of truth for the Google Apps Script URL
const GAS_URL =
  process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzmQKdUR0ZZlAbs94znoH-31AD8Fdccy_JJ47lobqg_hp-a5-s1LQggo7v_8-gRfUnl/exec"

/**
 * Proxy to Google Apps Script
 * All API calls go through this endpoint to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()

  searchParams.forEach((value, key) => {
    params.append(key, value)
  })

  const targetUrl = `${GAS_URL}?${params.toString()}`

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Apps Script returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GAS Proxy] GET error:", error)
    return NextResponse.json(
      { error: "Failed to connect to Google Apps Script" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()

  searchParams.forEach((value, key) => {
    params.append(key, value)
  })

  const body = await request.text()
  const targetUrl = `${GAS_URL}?${params.toString()}`

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain",
      },
      body,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Apps Script returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GAS Proxy] POST error:", error)
    return NextResponse.json(
      { error: "Failed to connect to Google Apps Script" },
      { status: 500 }
    )
  }
}
