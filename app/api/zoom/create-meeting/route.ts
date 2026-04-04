import { NextRequest, NextResponse } from 'next/server'

async function getZoomAccessToken(): Promise<string> {
  const accountId = (process.env.ZOOM_ACCOUNT_ID || '').trim()
  const clientId = (process.env.ZOOM_CLIENT_ID || '').trim()
  const clientSecret = (process.env.ZOOM_CLIENT_SECRET || '').trim()

  console.log('Zoom creds check — accountId length:', accountId.length, '| clientId length:', clientId.length, '| secret length:', clientSecret.length)

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Zoom token error: ${err}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { topic, startTime, durationMinutes = 60 } = await req.json()

    const token = await getZoomAccessToken()

    const body: Record<string, unknown> = {
      topic: topic || 'Math with Melinda',
      type: startTime ? 2 : 1, // 2 = scheduled, 1 = instant
      duration: durationMinutes,
      settings: {
        waiting_room: false,
        join_before_host: true,
        participant_video: true,
        host_video: true,
        mute_upon_entry: false,
      },
    }

    if (startTime) {
      body.start_time = startTime // ISO 8601 e.g. "2026-04-07T14:00:00"
      body.timezone = 'America/Chicago'
    }

    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Zoom create meeting error: ${err}`)
    }

    const meeting = await res.json()

    return NextResponse.json({
      meetingId: String(meeting.id),
      joinUrl: meeting.join_url,
      startUrl: meeting.start_url, // host link (Melinda uses this)
      topic: meeting.topic,
      startTime: meeting.start_time,
    })
  } catch (err: any) {
    console.error('Zoom create meeting error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create Zoom meeting' }, { status: 500 })
  }
}
