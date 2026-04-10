import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/lib/auth'
import { getTokenStatus } from '@/app/lib/uploadToken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { tokenId } = await params

    const status = await getTokenStatus(tokenId)
    if (!status) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (err: any) {
    console.error('Error fetching token status:', err)
    return NextResponse.json({ error: 'Failed to fetch token status' }, { status: 500 })
  }
}
