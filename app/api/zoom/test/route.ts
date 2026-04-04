import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ZOOM_ACCOUNT_ID_len: (process.env.ZOOM_ACCOUNT_ID || '').length,
    ZOOM_CLIENT_ID_len: (process.env.ZOOM_CLIENT_ID || '').length,
    ZOOM_CLIENT_SECRET_len: (process.env.ZOOM_CLIENT_SECRET || '').length,
    ZOOM_ACCOUNT_ID_first3: (process.env.ZOOM_ACCOUNT_ID || '').slice(0, 3),
    NODE_ENV: process.env.NODE_ENV,
  })
}
