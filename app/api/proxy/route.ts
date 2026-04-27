import { NextRequest, NextResponse } from "next/server"

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzcE7XMkAsafYtV70D-J4CtpPBQdj0h8mivvw7_vWeV5oMnjKT-c6tiLkyNN-QdAsFz/exec"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()

  searchParams.forEach((value, key) => {
    params.append(key, value)
  })

  const targetUrl = `${GAS_URL}?${params.toString()}`

  const response = await fetch(targetUrl, {
    method: "GET",
    redirect: "follow",
  })

  const data = await response.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()

  searchParams.forEach((value, key) => {
    params.append(key, value)
  })

  const body = await request.text()
  const targetUrl = `${GAS_URL}?${params.toString()}`

  const response = await fetch(targetUrl, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain",
    },
    body,
  })

  const data = await response.json()
  return NextResponse.json(data)
}
